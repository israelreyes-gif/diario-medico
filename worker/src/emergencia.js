import { json } from "./utils.js";

export async function getFichaEmergencia(env, usuarioId) {
  const fila = await env.DB.prepare(
    "SELECT grupo_sanguineo, alergias, enfermedades, contactos FROM fichas_emergencia WHERE usuario_id = ?"
  )
    .bind(usuarioId)
    .first();

  if (!fila) {
    return { grupoSanguineo: null, alergias: [], enfermedades: [], contactosPersonales: [], contactosMedicos: [] };
  }

  let contactosPersonales = [];
  let contactosMedicos = [];

  if (fila.contactos) {
    const parsed = JSON.parse(fila.contactos);
    if (Array.isArray(parsed)) {
      // Formato antiguo: una lista simple, la tratamos como "personales"
      contactosPersonales = parsed;
    } else {
      contactosPersonales = parsed.personales || [];
      contactosMedicos = parsed.medicos || [];
    }
  }

  return {
    grupoSanguineo: fila.grupo_sanguineo || null,
    alergias: fila.alergias ? JSON.parse(fila.alergias) : [],
    enfermedades: fila.enfermedades ? JSON.parse(fila.enfermedades) : [],
    contactosPersonales,
    contactosMedicos,
  };
}

export async function handleGetFichaEmergencia(env, usuarioId) {
  const ficha = await getFichaEmergencia(env, usuarioId);
  return json(ficha);
}

const GRUPOS_VALIDOS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

function validarContactos(lista) {
  for (const c of lista) {
    if (!c.nombre || !c.nombre.trim() || !c.telefono || !c.telefono.trim()) {
      return false;
    }
  }
  return true;
}

export async function handlePostFichaEmergencia(request, env, usuarioId) {
  const body = await request.json();
  const grupoSanguineo = body.grupoSanguineo || null;
  const alergias = Array.isArray(body.alergias) ? body.alergias.filter((a) => a && a.trim()) : [];
  const enfermedades = Array.isArray(body.enfermedades) ? body.enfermedades.filter((e) => e && e.trim()) : [];
  const contactosPersonales = Array.isArray(body.contactosPersonales) ? body.contactosPersonales : [];
  const contactosMedicos = Array.isArray(body.contactosMedicos) ? body.contactosMedicos : [];

  if (grupoSanguineo && !GRUPOS_VALIDOS.includes(grupoSanguineo)) {
    return json({ error: "Grupo sanguíneo no válido." }, 400);
  }

  if (!validarContactos(contactosPersonales)) {
    return json({ error: "Cada contacto personal necesita nombre y teléfono." }, 400);
  }
  if (!validarContactos(contactosMedicos)) {
    return json({ error: "Cada contacto médico necesita nombre y teléfono." }, 400);
  }

  const ahora = new Date().toISOString();
  const contactosJson = JSON.stringify({ personales: contactosPersonales, medicos: contactosMedicos });

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
    .bind(usuarioId, grupoSanguineo, JSON.stringify(alergias), JSON.stringify(enfermedades), contactosJson, ahora)
    .run();

  const ficha = await getFichaEmergencia(env, usuarioId);
  return json(ficha);
}
