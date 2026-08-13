// API del Diario Médico — usuarios, pastillero, histórico y búsqueda de medicamentos (CIMA)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

// ---------- Utilidades de contraseña ----------

function bufferToHex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generarSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return bufferToHex(bytes.buffer);
}

async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return bufferToHex(hashBuffer);
}

function generarToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return bufferToHex(bytes.buffer);
}

function passwordEsSegura(password) {
  if (password.length < 8) return false;
  const tieneLetra = /[a-zA-Z]/.test(password);
  const tieneNumero = /[0-9]/.test(password);
  return tieneLetra && tieneNumero;
}

// ---------- Autenticación ----------

async function handleRegister(request, env) {
  const body = await request.json();
  const usuario = (body.usuario || "").trim();
  const nombreCompleto = (body.nombreCompleto || "").trim();
  const password = body.password || "";

  if (usuario.length < 3) {
    return json({ error: "El nombre de usuario debe tener al menos 3 caracteres." }, 400);
  }
  if (nombreCompleto.length < 3) {
    return json({ error: "Indica tu nombre y apellidos." }, 400);
  }
  if (!passwordEsSegura(password)) {
    return json({ error: "La contraseña debe tener al menos 8 caracteres, con letras y números." }, 400);
  }

  const existente = await env.DB.prepare("SELECT id FROM usuarios WHERE nombre = ?").bind(usuario).first();
  if (existente) {
    return json({ error: "Ese nombre de usuario ya existe." }, 400);
  }

  const salt = generarSalt();
  const hash = await hashPassword(password, salt);
  const ahora = new Date().toISOString();

  const nuevoUsuario = await env.DB.prepare(
    "INSERT INTO usuarios (nombre, nombre_completo, pin_hash, pin_salt, creado_en) VALUES (?, ?, ?, ?, ?) RETURNING id"
  )
    .bind(usuario, nombreCompleto, hash, salt, ahora)
    .first();

  const token = await crearSesion(env, nuevoUsuario.id);
  return json({ token, usuario, nombreCompleto });
}

async function handleLogin(request, env) {
  const body = await request.json();
  const usuario = (body.usuario || "").trim();
  const password = body.password || "";

  const fila = await env.DB.prepare(
    "SELECT id, pin_hash, pin_salt, nombre_completo FROM usuarios WHERE nombre = ?"
  )
    .bind(usuario)
    .first();

  if (!fila) {
    return json({ error: "Usuario o contraseña incorrectos." }, 401);
  }

  const hashCalculado = await hashPassword(password, fila.pin_salt);
  if (hashCalculado !== fila.pin_hash) {
    return json({ error: "Usuario o contraseña incorrectos." }, 401);
  }

  const token = await crearSesion(env, fila.id);
  return json({ token, usuario, nombreCompleto: fila.nombre_completo });
}

async function crearSesion(env, usuarioId) {
  const token = generarToken();
  const ahora = new Date();
  const expira = new Date(ahora.getTime() + 30 * 24 * 60 * 60 * 1000);

  await env.DB.prepare(
    "INSERT INTO sesiones (token, usuario_id, creado_en, expira_en) VALUES (?, ?, ?, ?)"
  )
    .bind(token, usuarioId, ahora.toISOString(), expira.toISOString())
    .run();

  return token;
}

async function verificarSesion(request, env) {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return null;

  const sesion = await env.DB.prepare(
    "SELECT usuario_id, expira_en FROM sesiones WHERE token = ?"
  )
    .bind(token)
    .first();

  if (!sesion) return null;
  if (new Date(sesion.expira_en) < new Date()) {
    await env.DB.prepare("DELETE FROM sesiones WHERE token = ?").bind(token).run();
    return null;
  }

  const nuevaExpira = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare("UPDATE sesiones SET expira_en = ? WHERE token = ?")
    .bind(nuevaExpira, token)
    .run();

  return sesion.usuario_id;
}

async function handleLogout(request, env) {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (token) {
    await env.DB.prepare("DELETE FROM sesiones WHERE token = ?").bind(token).run();
  }
  return json({ ok: true });
}

// ---------- Búsqueda de medicamentos (CIMA - AEMPS) ----------

async function handleBuscarMedicamentos(request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();

  if (q.length < 3) {
    return json({ resultados: [] });
  }

  try {
    const cimaRes = await fetch(
      `https://cima.aemps.es/cima/rest/medicamentos?nombre=${encodeURIComponent(q)}&pagina=1`
    );
    if (!cimaRes.ok) {
      return json({ resultados: [] });
    }
    const data = await cimaRes.json();
    const resultados = (data.resultados || []).slice(0, 8).map((m) => ({
      nombre: m.nombre,
      laboratorio: m.labtitular || "",
    }));
    return json({ resultados });
  } catch (err) {
    return json({ resultados: [] });
  }
}

// ---------- Medicamentos (por usuario) ----------

async function getMedicamentos(env, usuarioId) {
  const { results } = await env.DB.prepare(
    "SELECT id, nombre, desayuno, comida, cena, nota FROM medicamentos WHERE usuario_id = ? ORDER BY id ASC"
  )
    .bind(usuarioId)
    .all();
  return results;
}

function sonIguales(listaA, listaB) {
  if (listaA.length !== listaB.length) return false;
  const normaliza = (lista) =>
    [...lista]
      .map((m) => ({
        nombre: m.nombre,
        desayuno: Number(m.desayuno) || 0,
        comida: Number(m.comida) || 0,
        cena: Number(m.cena) || 0,
        nota: m.nota || "",
      }))
      .sort((x, y) => x.nombre.localeCompare(y.nombre));
  return JSON.stringify(normaliza(listaA)) === JSON.stringify(normaliza(listaB));
}

async function guardarSnapshot(env, usuarioId, medicamentos) {
  const ahora = new Date().toISOString();
  const snapshotResult = await env.DB.prepare(
    "INSERT INTO snapshots (creado_en, usuario_id) VALUES (?, ?) RETURNING id"
  )
    .bind(ahora, usuarioId)
    .first();
  const snapshotId = snapshotResult.id;

  for (const m of medicamentos) {
    await env.DB.prepare(
      `INSERT INTO snapshot_medicamentos (snapshot_id, nombre, desayuno, comida, cena, nota)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(snapshotId, m.nombre, m.desayuno || 0, m.comida || 0, m.cena || 0, m.nota || "")
      .run();
  }
}

async function handlePostMedicamentos(request, env, usuarioId) {
  const body = await request.json();
  const nuevaLista = Array.isArray(body) ? body : body.medicamentos;

  if (!Array.isArray(nuevaLista)) {
    return json({ error: "Formato inválido: se esperaba una lista de medicamentos." }, 400);
  }

  for (const m of nuevaLista) {
    const dosisTotal = (Number(m.desayuno) || 0) + (Number(m.comida) || 0) + (Number(m.cena) || 0);
    if (!m.nombre || dosisTotal === 0) {
      return json(
        { error: `El medicamento "${m.nombre || "(sin nombre)"}" necesita nombre y al menos una dosis.` },
        400
      );
    }
  }

  const ultimoSnapshot = await env.DB.prepare(
    "SELECT id FROM snapshots WHERE usuario_id = ? ORDER BY id DESC LIMIT 1"
  )
    .bind(usuarioId)
    .first();

  let debeCrearSnapshot = true;
  if (ultimoSnapshot) {
    const { results: medsUltimoSnapshot } = await env.DB.prepare(
      "SELECT nombre, desayuno, comida, cena, nota FROM snapshot_medicamentos WHERE snapshot_id = ?"
    )
      .bind(ultimoSnapshot.id)
      .all();
    debeCrearSnapshot = !sonIguales(medsUltimoSnapshot, nuevaLista);
  }

  const ahora = new Date().toISOString();

  await env.DB.prepare("DELETE FROM medicamentos WHERE usuario_id = ?").bind(usuarioId).run();
  for (const m of nuevaLista) {
    await env.DB.prepare(
      `INSERT INTO medicamentos (nombre, desayuno, comida, cena, nota, actualizado_en, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(m.nombre, m.desayuno || 0, m.comida || 0, m.cena || 0, m.nota || "", ahora, usuarioId)
      .run();
  }

  if (debeCrearSnapshot) {
    await guardarSnapshot(env, usuarioId, nuevaLista);
  }

  const listaFinal = await getMedicamentos(env, usuarioId);
  return json({ medicamentos: listaFinal });
}

async function handleGetHistorico(env, usuarioId) {
  const { results: snapshots } = await env.DB.prepare(
    "SELECT id, creado_en FROM snapshots WHERE usuario_id = ? ORDER BY id DESC"
  )
    .bind(usuarioId)
    .all();

  const historico = [];
  for (const snap of snapshots) {
    const { results: meds } = await env.DB.prepare(
      "SELECT nombre, desayuno, comida, cena, nota FROM snapshot_medicamentos WHERE snapshot_id = ?"
    )
      .bind(snap.id)
      .all();
    historico.push({ id: snap.id, creado_en: snap.creado_en, medicamentos: meds });
  }

  return json({ historico });
}

// ---------- Rutas ----------

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (url.pathname === "/register" && request.method === "POST") {
        return await handleRegister(request, env);
      }

      if (url.pathname === "/login" && request.method === "POST") {
        return await handleLogin(request, env);
      }

      if (url.pathname === "/logout" && request.method === "POST") {
        return await handleLogout(request, env);
      }

      if (url.pathname === "/medicamentos-buscar" && request.method === "GET") {
        return await handleBuscarMedicamentos(request);
      }

      const usuarioId = await verificarSesion(request, env);
      if (!usuarioId) {
        return json({ error: "Sesión no válida o caducada. Inicia sesión de nuevo." }, 401);
      }

      if (url.pathname === "/medicamentos" && request.method === "GET") {
        const medicamentos = await getMedicamentos(env, usuarioId);
        return json({ medicamentos });
      }

      if (url.pathname === "/medicamentos" && request.method === "POST") {
        return await handlePostMedicamentos(request, env, usuarioId);
      }

      if (url.pathname === "/historico" && request.method === "GET") {
        return await handleGetHistorico(env, usuarioId);
      }

      return json({ error: "Ruta no encontrada" }, 404);
    } catch (err) {
      return json({ error: "Error interno: " + err.message }, 500);
    }
  },
};
