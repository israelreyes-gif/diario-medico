import { json } from "./utils.js";

export async function getFichaEmergencia(env, usuarioId) {
  const fila = await env.DB.prepare(
    "SELECT grupo_sanguineo, alergias, enfermedades, contactos FROM fichas_emergencia WHERE usuario_id = ?"
  )
    .bind(usuarioId)
    .first();

  if (!fila) {
    return { grupoSanguineo: null, alergias: [], enfermedades: [], contactos: [] };
  }

  return {
    grupoSanguineo: fila.grupo_sanguineo || null,
    alergias: fila.alergias ? JSON.parse(fila.alergias) : [],
    enfermedades: fila.enfermedades ? JSON.parse(fila.enfermedades) : [],
    contactos: fila.contactos ? JSON.parse(fila.contactos) : [],
  };
}

export async function handleGetFichaEmergencia(env, usuarioId) {
  const ficha = await getFichaEmergencia(env, usuarioId);
  return json(ficha);
}

const GRUPOS_VALIDOS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

export async function handlePostFichaEmergencia(request, env, usuarioId) {
  const body = await request.json();
  const grupoSanguineo = body.grupoSanguineo || null;
  const alergias = Array.isArray(body.alergias) ? body.alergias.filter((a) => a && a.trim()) : [];
  const enfermedades = Array.isArray(body.enfermedades) ? body.enfermedades.filter((e) => e && e.trim()) : [];
  const contactos = Array.isArray(body.contactos) ? body.contactos : [];

  if (grupoSanguineo && !GRUPOS_VALIDOS.includes(grupoSanguineo)) {
    return json({ error: "Grupo sanguíneo no válido." }, 400);
  }

  if (contactos.length > 2) {
    return json({ error: "Solo se permiten hasta 2 contactos de emergencia." }, 400);
  }

  for (const c of contactos) {
    if (!c.nombre || !c.nombre.trim() || !c.telefono || !c.telefono.trim()) {
      return json({ error: "Cada contacto necesita nombre y teléfono." }, 400);
    }
  }

  const ahora = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO fichas_emergencia (usuario_id, grupo_sanguineo, alergias, enfermedades, contactos, actualizado_en)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(usuario_id) DO UPDATE SET
       grupo_sanguineo = excluded.grupo_sanguineo,
       alergias = excluded.alergias,
       enfermedades = excluded.enfermedades,
       contactos = excluded.contactos,
       actualizado_en = excluded.actualizado_en`
  )
    .bind(usuarioId, grupoSanguineo, JSON.stringify(alergias), JSON.stringify(enfermedades), JSON.stringify(contactos), ahora)
    .run();

  const ficha = await getFichaEmergencia(env, usuarioId);
  return json(ficha);
}
