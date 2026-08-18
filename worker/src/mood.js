import { json } from "./utils.js";

const FRANJAS = ["manana", "tarde", "noche"];
const EMOCIONES_VALIDAS = [
  "alegria", "calma", "ilusion", "cansancio",
  "tristeza", "enfado", "agobio", "ansiedad",
];

// A partir de la hora local del dispositivo (0-23), calcula qué franja debería estar activa.
// Esto se usa para impedir, desde el propio servidor, que se guarde una franja fuera de su horario
// (5-13 mañana, 13-20 tarde, 20-5 noche), aunque alguien intente llamar a la API directamente.
function franjaSegunHora(hora) {
  if (hora >= 5 && hora < 13) return "manana";
  if (hora >= 13 && hora < 20) return "tarde";
  return "noche";
}

async function getEstadoDia(env, usuarioId, fecha) {
  const fila = await env.DB.prepare(
    "SELECT manana, tarde, noche FROM estados_animo WHERE usuario_id = ? AND fecha = ?"
  )
    .bind(usuarioId, fecha)
    .first();

  if (!fila) {
    return { fecha, manana: null, tarde: null, noche: null };
  }

  return {
    fecha,
    manana: fila.manana ? JSON.parse(fila.manana) : null,
    tarde: fila.tarde ? JSON.parse(fila.tarde) : null,
    noche: fila.noche ? JSON.parse(fila.noche) : null,
  };
}

export async function handleGetEstadoDia(request, env, usuarioId) {
  const url = new URL(request.url);
  const fecha = url.searchParams.get("fecha");

  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return json({ error: "Fecha no válida, se espera YYYY-MM-DD." }, 400);
  }

  const estado = await getEstadoDia(env, usuarioId, fecha);
  return json(estado);
}

export async function handlePostEstadoAnimo(request, env, usuarioId) {
  const body = await request.json();
  const { fecha, franja, emocion, intensidad, horaLocal } = body;

  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return json({ error: "Fecha no válida, se espera YYYY-MM-DD." }, 400);
  }
  if (!FRANJAS.includes(franja)) {
    return json({ error: "Franja no válida." }, 400);
  }
  if (!EMOCIONES_VALIDAS.includes(emocion)) {
    return json({ error: "Emoción no válida." }, 400);
  }
  if (!Number.isInteger(intensidad) || intensidad < 1 || intensidad > 5) {
    return json({ error: "La intensidad debe ser un número entero entre 1 y 5." }, 400);
  }
  if (typeof horaLocal !== "number" || horaLocal < 0 || horaLocal > 23) {
    return json({ error: "Hora local no válida." }, 400);
  }

  const franjaEsperada = franjaSegunHora(horaLocal);
  if (franja !== franjaEsperada) {
    return json(
      { error: `Ahora mismo solo puedes registrar la franja de "${franjaEsperada}".` },
      400
    );
  }

  const valorJson = JSON.stringify({ emocion, intensidad });

  const columnasPermitidas = { manana: "manana", tarde: "tarde", noche: "noche" };
  const columna = columnasPermitidas[franja];

  await env.DB.prepare(
    `INSERT INTO estados_animo (usuario_id, fecha, ${columna})
     VALUES (?, ?, ?)
     ON CONFLICT(usuario_id, fecha) DO UPDATE SET ${columna} = excluded.${columna}`
  )
    .bind(usuarioId, fecha, valorJson)
    .run();

  const estado = await getEstadoDia(env, usuarioId, fecha);
  return json(estado);
}

export async function handleGetEstadoMes(request, env, usuarioId) {
  const url = new URL(request.url);
  const year = url.searchParams.get("year");
  const mes = url.searchParams.get("mes");

  if (!year || !mes || !/^\d{4}$/.test(year) || !/^\d{1,2}$/.test(mes)) {
    return json({ error: "Parámetros year/mes no válidos." }, 400);
  }

  const mesPadded = mes.padStart(2, "0");
  const prefijo = `${year}-${mesPadded}-`;

  const { results } = await env.DB.prepare(
    "SELECT fecha, manana, tarde, noche FROM estados_animo WHERE usuario_id = ? AND fecha LIKE ? ORDER BY fecha ASC"
  )
    .bind(usuarioId, `${prefijo}%`)
    .all();

  const dias = results.map((f) => ({
    fecha: f.fecha,
    manana: f.manana ? JSON.parse(f.manana) : null,
    tarde: f.tarde ? JSON.parse(f.tarde) : null,
    noche: f.noche ? JSON.parse(f.noche) : null,
  }));

  return json({ dias });
}
