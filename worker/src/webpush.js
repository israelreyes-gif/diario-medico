// Implementación mínima de Web Push (RFC 8291 + VAPID) usando solo Web Crypto,
// disponible de forma nativa en Cloudflare Workers, sin depender de paquetes npm.

function base64UrlToUint8Array(base64Url) {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function uint8ArrayToBase64Url(bytes) {
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function coordenadasXYDesdeClavePublica(publicKeyB64Url) {
  const raw = base64UrlToUint8Array(publicKeyB64Url);
  const x = raw.slice(1, 33);
  const y = raw.slice(33, 65);
  return { x: uint8ArrayToBase64Url(x), y: uint8ArrayToBase64Url(y) };
}

async function importVapidPrivateKey(privateKeyB64Url, publicKeyB64Url) {
  const { x, y } = coordenadasXYDesdeClavePublica(publicKeyB64Url);

  const jwk = {
    kty: "EC",
    crv: "P-256",
    x,
    y,
    d: privateKeyB64Url,
    ext: true,
  };

  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
}

async function crearVapidJWT(endpointOrigin, subject, publicKeyB64Url, privateKeyB64Url) {
  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: endpointOrigin,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: subject,
  };

  const encoder = new TextEncoder();
  const headerB64 = uint8ArrayToBase64Url(encoder.encode(JSON.stringify(header)));
  const payloadB64 = uint8ArrayToBase64Url(encoder.encode(JSON.stringify(payload)));
  const unsigned = `${headerB64}.${payloadB64}`;

  const key = await importVapidPrivateKey(privateKeyB64Url, publicKeyB64Url);
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    encoder.encode(unsigned)
  );

  const signatureB64 = uint8ArrayToBase64Url(new Uint8Array(signature));
  return `${unsigned}.${signatureB64}`;
}

function concatUint8(arrays) {
  const total = arrays.reduce((acc, a) => acc + a.length, 0);
  const resultado = new Uint8Array(total);
  let offset = 0;
  for (const arr of arrays) {
    resultado.set(arr, offset);
    offset += arr.length;
  }
  return resultado;
}

async function hkdf(clave, salt, info, longitud) {
  const claveBase = await crypto.subtle.importKey("raw", clave, "HKDF", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info },
    claveBase,
    longitud * 8
  );
  return new Uint8Array(bits);
}

export async function enviarPush(suscripcion, payloadObjeto, env) {
  const { endpoint, p256dh, auth } = suscripcion;
  const url = new URL(endpoint);
  const origin = `${url.protocol}//${url.host}`;

  const jwt = await crearVapidJWT(origin, env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);

  const payloadTexto = JSON.stringify(payloadObjeto);
  const payloadBytes = new TextEncoder().encode(payloadTexto);

  const claveServidor = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );
  const claveServidorPublicaRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", claveServidor.publicKey)
  );

  const claveClienteRaw = base64UrlToUint8Array(p256dh);
  const authSecret = base64UrlToUint8Array(auth);

  const claveClientePublica = await crypto.subtle.importKey(
    "raw",
    claveClienteRaw,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  const secretoCompartidoBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: claveClientePublica },
    claveServidor.privateKey,
    256
  );
  const secretoCompartido = new Uint8Array(secretoCompartidoBits);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();

  const infoAuth = concatUint8([
    encoder.encode("WebPush: info\0"),
    claveClienteRaw,
    claveServidorPublicaRaw,
  ]);
  const prk = await hkdf(secretoCompartido, authSecret, infoAuth, 32);

  const cek = await hkdf(prk, salt, encoder.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(prk, salt, encoder.encode("Content-Encoding: nonce\0"), 12);

  // Byte de relleno: 0x02 marca "este es el único/último bloque" según RFC 8188.
  // (Antes tenía 0x00 por error, lo que hacía el mensaje indescifrable para el navegador.)
  const delimitador = new Uint8Array([2]);
  const contenidoConRelleno = concatUint8([payloadBytes, delimitador]);

  const claveAesGcm = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const cifrado = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, claveAesGcm, contenidoConRelleno)
  );

  // recordSize es solo el tamaño del bloque cifrado, sin sumar la cabecera.
  const recordSize = new Uint8Array(4);
  new DataView(recordSize.buffer).setUint32(0, cifrado.length, false);

  const keyIdLength = new Uint8Array([65]);
  const header = concatUint8([salt, recordSize, keyIdLength, claveServidorPublicaRaw]);
  const cuerpoFinal = concatUint8([header, cifrado]);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      TTL: "86400",
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      Authorization: `vapid t=${jwt}, k=${env.VAPID_PUBLIC_KEY}`,
    },
    body: cuerpoFinal,
  });

  return { ok: res.ok, status: res.status };
}
