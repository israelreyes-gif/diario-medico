import { json } from "./utils.js";

const EMOCIONES_VALIDAS = [
  "alegria", "calma", "ilusion", "cansancio",
  "tristeza", "enfado", "agobio", "ansiedad",
];

function horaActualHHMM() {
  const d = new Date();
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

// Devuelve todos los registros de un día concreto, ordenados por hora
export async function handleGetRegistrosDia(request, env, usuarioId) {
  const url = new URL(request.url);
  const fecha = url.searchParams.get("fecha");

  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return json({ error: "Fecha no válida, se espera YYYY-MM-DD." }, 400);
  }

  const { results } = await env.DB.prepare(
    "SELECT id, hora, emocion, intensidad FROM registros_animo WHERE usuario_id = ? AND fecha = ? ORDER BY hora ASC, id ASC"
  )
    .bind(usuarioId, fecha)
    .all();

  return json({ fecha, registros: results });
}

export async function handleCrearRegistroAnimo(request, env, usuarioId) {
  const body = await request.json();
  const { fecha, hora, emocion, intensidad } = body;

  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return json({ error: "Fecha no válida, se espera YYYY-MM-DD." }, 400);
  }
  const horaFinal = hora && /^\d{2}:\d{2}$/.test(hora) ? hora : horaActualHHMM();
  if (!EMOCIONES_VALIDAS.includes(emocion)) {
    return json({ error: "Emoción no válida." }, 400);
  }
  if (!Number.isInteger(intensidad) || intensidad < 1 || intensidad > 5) {
    return json({ error: "La intensidad debe ser un número entero entre 1 y 5." }, 400);
  }

  const ahora = new Date().toISOString();

  const nuevo = await env.DB.prepare(
    `INSERT INTO registros_animo (usuario_id, fecha, hora, emocion, intensidad, creado_en)
     VALUES (?, ?, ?, ?, ?, ?) RETURNING id`
  )
    .bind(usuarioId, fecha, horaFinal, emocion, intensidad, ahora)
    .first();

  return json({ id: nuevo.id, fecha, hora: horaFinal, emocion, intensidad });
}

export async function handleEditarRegistroAnimo(request, env, usuarioId, registroId) {
  const body = await request.json();
  const { hora, emocion, intensidad } = body;

  const existente = await env.DB.prepare(
    "SELECT id FROM registros_animo WHERE id = ? AND usuario_id = ?"
  )
    .bind(registroId, usuarioId)
    .first();

  if (!existente) {
    return json({ error: "Registro no encontrado." }, 404);
  }

  if (hora && !/^\d{2}:\d{2}$/.test(hora)) {
    return json({ error: "Hora no válida, se espera HH:MM." }, 400);
  }
  if (emocion && !EMOCIONES_VALIDAS.includes(emocion)) {
    return json({ error: "Emoción no válida." }, 400);
  }
  if (intensidad !== undefined && (!Number.isInteger(intensidad) || intensidad < 1 || intensidad > 5)) {
    return json({ error: "La intensidad debe ser un número entero entre 1 y 5." }, 400);
  }

  await env.DB.prepare(
    `UPDATE registros_animo SET
       hora = COALESCE(?, hora),
       emocion = COALESCE(?, emocion),
       intensidad = COALESCE(?, intensidad)
     WHERE id = ? AND usuario_id = ?`
  )
    .bind(hora || null, emocion || null, intensidad ?? null, registroId, usuarioId)
    .run();

  return json({ ok: true });
}

export async function handleBorrarRegistroAnimo(env, usuarioId, registroId) {
  await env.DB.prepare("DELETE FROM registros_animo WHERE id = ? AND usuario_id = ?")
    .bind(registroId, usuarioId)
    .run();

  return json({ ok: true });
}

// Todos los registros de un mes, agrupados por día (para el calendario)
export async function handleGetRegistrosMes(request, env, usuarioId) {
  const url = new URL(request.url);
  const year = url.searchParams.get("year");
  const mes = url.searchParams.get("mes");

  if (!year || !mes || !/^\d{4}$/.test(year) || !/^\d{1,2}$/.test(mes)) {
    return json({ error: "Parámetros year/mes no válidos." }, 400);
  }

  const prefijo = `${year}-${mes.padStart(2, "0")}-`;

  const { results } = await env.DB.prepare(
    "SELECT fecha, hora, emocion, intensidad FROM registros_animo WHERE usuario_id = ? AND fecha LIKE ? ORDER BY fecha ASC, hora ASC"
  )
    .bind(usuarioId, `${prefijo}%`)
    .all();

  return json({ registros: results });
}

// Todos los registros de un rango de fechas (para los resúmenes semanal/mensual/anual)
export async function handleGetRegistrosRango(request, env, usuarioId) {
  const url = new URL(request.url);
  const inicio = url.searchParams.get("inicio");
  const fin = url.searchParams.get("fin");

  if (!inicio || !fin || !/^\d{4}-\d{2}-\d{2}$/.test(inicio) || !/^\d{4}-\d{2}-\d{2}$/.test(fin)) {
    return json({ error: "Parámetros inicio/fin no válidos, se espera YYYY-MM-DD." }, 400);
  }
  if (inicio > fin) {
    return json({ error: "La fecha de inicio debe ser anterior a la de fin." }, 400);
  }

  const diasDiferencia = (new Date(fin) - new Date(inicio)) / (1000 * 60 * 60 * 24);
  if (diasDiferencia > 370) {
    return json({ error: "El rango de fechas es demasiado amplio." }, 400);
  }

  const { results } = await env.DB.prepare(
    "SELECT fecha, hora, emocion, intensidad FROM registros_animo WHERE usuario_id = ? AND fecha BETWEEN ? AND ? ORDER BY fecha ASC, hora ASC"
  )
    .bind(usuarioId, inicio, fin)
    .all();

  return json({ registros: results });
}
