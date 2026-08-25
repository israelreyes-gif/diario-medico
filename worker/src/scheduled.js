import { enviarPush } from "./webpush.js";

const MENSAJES_FRANJA = {
  manana: { titulo: "☀️ Buenos días", cuerpo: "¿Cómo te sientes esta mañana? Toca para registrarlo." },
  tarde: { titulo: "🌤️ Buenas tardes", cuerpo: "¿Cómo va tu tarde? Toca para registrar tu estado." },
  noche: { titulo: "🌙 Buenas noches", cuerpo: "¿Cómo ha ido tu noche? Toca para registrarlo antes de dormir." },
};

function horaEnEspana(fechaUTC) {
  const year = fechaUTC.getUTCFullYear();
  const finMarzo = new Date(Date.UTC(year, 2, 31));
  finMarzo.setUTCDate(31 - ((finMarzo.getUTCDay() + 7) % 7));
  const finOctubre = new Date(Date.UTC(year, 9, 31));
  finOctubre.setUTCDate(31 - ((finOctubre.getUTCDay() + 7) % 7));

  const enHorarioVerano = fechaUTC >= finMarzo && fechaUTC < finOctubre;
  const offset = enHorarioVerano ? 2 : 1;

  return (fechaUTC.getUTCHours() + offset) % 24;
}

function franjaSiCoincideHora(horaEspana) {
  if (horaEspana === 5) return "manana";
  if (horaEspana === 13) return "tarde";
  if (horaEspana === 20) return "noche";
  return null;
}

async function enviarATodasLasSuscripciones(env, franja) {
  const mensaje = MENSAJES_FRANJA[franja];
  const { results: suscripciones } = await env.DB.prepare(
    "SELECT id, endpoint, p256dh, auth FROM suscripciones_push"
  ).all();

  const resultados = [];

  for (const sub of suscripciones) {
    try {
      const resultado = await enviarPush(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        { titulo: mensaje.titulo, cuerpo: mensaje.cuerpo, url: "./" },
        env
      );
      resultados.push({ id: sub.id, ok: resultado.ok, status: resultado.status });

      if (!resultado.ok && (resultado.status === 404 || resultado.status === 410)) {
        await env.DB.prepare("DELETE FROM suscripciones_push WHERE id = ?").bind(sub.id).run();
      }
    } catch (err) {
      resultados.push({ id: sub.id, ok: false, error: err.message, stack: err.stack });
    }
  }

  return resultados;
}

export async function handleScheduled(event, env) {
  const ahoraUTC = new Date(event.scheduledTime);
  const horaEspana = horaEnEspana(ahoraUTC);
  const franja = franjaSiCoincideHora(horaEspana);

  if (!franja) return;

  await enviarATodasLasSuscripciones(env, franja);
}

// Ruta de prueba temporal: dispara el envío inmediatamente (sin esperar a la hora en punto)
// y devuelve el resultado/error de cada suscripción, para depurar el envío real.
export async function handleTestPush(request, env) {
  const url = new URL(request.url);
  const franja = url.searchParams.get("franja") || "noche";

  if (!MENSAJES_FRANJA[franja]) {
    return new Response(JSON.stringify({ error: "Franja no válida. Usa manana, tarde o noche." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const resultados = await enviarATodasLasSuscripciones(env, franja);
  return new Response(JSON.stringify({ resultados }, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
}
