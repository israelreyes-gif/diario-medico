import { json } from "./utils.js";

function filaPorDefecto(usuarioId) {
  return {
    usuarioId,
    manana: { activo: false, hora: 8 },
    tarde: { activo: false, hora: 15 },
    noche: { activo: false, hora: 21 },
  };
}

function filaDbAObjeto(fila) {
  return {
    manana: { activo: !!fila.manana_activo, hora: fila.manana_hora },
    tarde: { activo: !!fila.tarde_activo, hora: fila.tarde_hora },
    noche: { activo: !!fila.noche_activo, hora: fila.noche_hora },
  };
}

export async function handleGetNotifConfig(env, usuarioId) {
  const fila = await env.DB.prepare(
    "SELECT manana_activo, manana_hora, tarde_activo, tarde_hora, noche_activo, noche_hora FROM notificaciones_config WHERE usuario_id = ?"
  )
    .bind(usuarioId)
    .first();

  if (!fila) {
    const porDefecto = filaPorDefecto(usuarioId);
    return json({ manana: porDefecto.manana, tarde: porDefecto.tarde, noche: porDefecto.noche });
  }

  return json(filaDbAObjeto(fila));
}

function validarFranja(franja) {
  if (!franja || typeof franja.activo !== "boolean") return false;
  if (!Number.isInteger(franja.hora) || franja.hora < 0 || franja.hora > 23) return false;
  return true;
}

export async function handlePostNotifConfig(request, env, usuarioId) {
  const body = await request.json();
  const { manana, tarde, noche } = body;

  if (!validarFranja(manana) || !validarFranja(tarde) || !validarFranja(noche)) {
    return json({ error: "Configuración no válida." }, 400);
  }

  const ahora = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO notificaciones_config
       (usuario_id, manana_activo, manana_hora, tarde_activo, tarde_hora, noche_activo, noche_hora, actualizado_en)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(usuario_id) DO UPDATE SET
       manana_activo = excluded.manana_activo,
       manana_hora = excluded.manana_hora,
       tarde_activo = excluded.tarde_activo,
       tarde_hora = excluded.tarde_hora,
       noche_activo = excluded.noche_activo,
       noche_hora = excluded.noche_hora,
       actualizado_en = excluded.actualizado_en`
  )
    .bind(
      usuarioId,
      manana.activo ? 1 : 0, manana.hora,
      tarde.activo ? 1 : 0, tarde.hora,
      noche.activo ? 1 : 0, noche.hora,
      ahora
    )
    .run();

  return json({ manana, tarde, noche });
}
