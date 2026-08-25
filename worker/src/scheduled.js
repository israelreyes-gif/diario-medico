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

  for (const sub of suscripciones) {
    try {
      const resultado = await enviarPush(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        { titulo: mensaje.titulo, cuerpo: mensaje.cuerpo, url: "./" },
        env
      );

      if (!resultado.ok && (resultado.status === 404 || resultado.status === 410)) {
        await env.DB.prepare("DELETE FROM suscripciones_push WHERE id = ?").bind(sub.id).run();
      }
    } catch (err) {
      // si falla el envío a una suscripción concreta, seguimos con las demás
    }
  }
}

export async function handleScheduled(event, env) {
  const ahoraUTC = new Date(event.scheduledTime);
  const horaEspana = horaEnEspana(ahoraUTC);
  const franja = franjaSiCoincideHora(horaEspana);

  if (!franja) return;

  await enviarATodasLasSuscripciones(env, franja);
}
