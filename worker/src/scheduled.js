import { enviarPush } from "./webpush.js";

const MENSAJES_FRANJA = {
  manana: { titulo: "☀️ Buenos días", cuerpo: "¿Cómo te sientes esta mañana? Toca para registrarlo." },
  tarde: { titulo: "🌤️ Buenas tardes", cuerpo: "¿Cómo va tu tarde? Toca para registrar tu estado." },
  noche: { titulo: "🌙 Buenas noches", cuerpo: "¿Cómo ha ido tu noche? Toca para registrarlo antes de dormir." },
};

// Cloudflare ejecuta el cron en UTC. Calculamos la hora de España a mano (CET/CEST),
// aplicando el cambio de horario de verano de forma aproximada (último domingo de marzo/octubre).
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

export async function handleScheduled(event, env) {
  const ahoraUTC = new Date(event.scheduledTime);
  const horaEspana = horaEnEspana(ahoraUTC);

  // Busca, entre todos los usuarios con configuración, cuáles tienen alguna franja
  // activa justo a esta hora — cada usuario puede tener sus horarios distintos.
  const { results: configs } = await env.DB.prepare(
    `SELECT usuario_id,
            manana_activo, manana_hora,
            tarde_activo, tarde_hora,
            noche_activo, noche_hora
     FROM notificaciones_config
     WHERE (manana_activo = 1 AND manana_hora = ?)
        OR (tarde_activo = 1 AND tarde_hora = ?)
        OR (noche_activo = 1 AND noche_hora = ?)`
  )
    .bind(horaEspana, horaEspana, horaEspana)
    .all();

  if (configs.length === 0) return;

  for (const cfg of configs) {
    const franjas = [];
    if (cfg.manana_activo && cfg.manana_hora === horaEspana) franjas.push("manana");
    if (cfg.tarde_activo && cfg.tarde_hora === horaEspana) franjas.push("tarde");
    if (cfg.noche_activo && cfg.noche_hora === horaEspana) franjas.push("noche");

    const { results: suscripciones } = await env.DB.prepare(
      "SELECT id, endpoint, p256dh, auth FROM suscripciones_push WHERE usuario_id = ?"
    )
      .bind(cfg.usuario_id)
      .all();

    for (const franja of franjas) {
      const mensaje = MENSAJES_FRANJA[franja];

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
  }
}
