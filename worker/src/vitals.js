import { json } from "./utils.js";

const TIPOS_VALIDOS = ["tension", "frecuencia_cardiaca", "glucosa", "peso", "temperatura"];

function horaActualHHMM() {
  const d = new Date();
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

function validarValorPorTipo(tipo, valor) {
  if (tipo === "tension") {
    const { sistolica, diastolica } = valor || {};
    if (!Number.isInteger(sistolica) || sistolica < 40 || sistolica > 300) return false;
    if (!Number.isInteger(diastolica) || diastolica < 20 || diastolica > 200) return false;
    return true;
  }

  const { valor: n } = valor || {};
  if (typeof n !== "number" || Number.isNaN(n)) return false;

  if (tipo === "frecuencia_cardiaca") return n >= 20 && n <= 250;
  if (tipo === "glucosa") return n >= 10 && n <= 600;
  if (tipo === "peso") return n >= 1 && n <= 400;
  if (tipo === "temperatura") return n >= 30 && n <= 45;

  return false;
}

export async function handleGetVitalsDia(request, env, usuarioId) {
  const url = new URL(request.url);
  const fecha = url.searchParams.get("fecha");

  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return json({ error: "Fecha no válida, se espera YYYY-MM-DD." }, 400);
  }

  const { results } = await env.DB.prepare(
    "SELECT id, hora, tipo, valor FROM constantes_vitales WHERE usuario_id = ? AND fecha = ? ORDER BY hora ASC, id ASC"
  )
    .bind(usuarioId, fecha)
    .all();

  const registros = results.map((r) => ({ ...r, valor: JSON.parse(r.valor) }));
  return json({ fecha, registros });
}

export async function handleCrearVital(request, env, usuarioId) {
  const body = await request.json();
  const { fecha, hora, tipo, valor } = body;

  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return json({ error: "Fecha no válida, se espera YYYY-MM-DD." }, 400);
  }
  const horaFinal = hora && /^\d{2}:\d{2}$/.test(hora) ? hora : horaActualHHMM();
  if (!TIPOS_VALIDOS.includes(tipo)) {
    return json({ error: "Tipo de constante no válido." }, 400);
  }
  if (!validarValorPorTipo(tipo, valor)) {
    return json({ error: "El valor introducido no es válido para este tipo de constante." }, 400);
  }

  const ahora = new Date().toISOString();
  const valorJson = JSON.stringify(valor);

  const nuevo = await env.DB.prepare(
    `INSERT INTO constantes_vitales (usuario_id, fecha, hora, tipo, valor, creado_en)
     VALUES (?, ?, ?, ?, ?, ?) RETURNING id`
  )
    .bind(usuarioId, fecha, horaFinal, tipo, valorJson, ahora)
    .first();

  return json({ id: nuevo.id, fecha, hora: horaFinal, tipo, valor });
}

export async function handleBorrarVital(env, usuarioId, vitalId) {
  await env.DB.prepare("DELETE FROM constantes_vitales WHERE id = ? AND usuario_id = ?")
    .bind(vitalId, usuarioId)
    .run();

  return json({ ok: true });
}

// Todos los registros del mes, para marcar en el calendario los días con constantes
export async function handleGetVitalsMes(request, env, usuarioId) {
  const url = new URL(request.url);
  const year = url.searchParams.get("year");
  const mes = url.searchParams.get("mes");

  if (!year || !mes || !/^\d{4}$/.test(year) || !/^\d{1,2}$/.test(mes)) {
    return json({ error: "Parámetros year/mes no válidos." }, 400);
  }

  const prefijo = `${year}-${mes.padStart(2, "0")}-`;

  const { results } = await env.DB.prepare(
    "SELECT DISTINCT fecha FROM constantes_vitales WHERE usuario_id = ? AND fecha LIKE ?"
  )
    .bind(usuarioId, `${prefijo}%`)
    .all();

  return json({ diasConConstantes: results.map((r) => r.fecha) });
}
