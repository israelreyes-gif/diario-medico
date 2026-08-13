// API del Diario Médico — gestiona el pastillero actual y su histórico de cambios

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function getMedicamentos(env) {
  const { results } = await env.DB.prepare(
    "SELECT id, nombre, desayuno, comida, cena, nota FROM medicamentos ORDER BY id ASC"
  ).all();
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

async function guardarSnapshot(env, medicamentos) {
  const ahora = new Date().toISOString();
  const snapshotResult = await env.DB.prepare(
    "INSERT INTO snapshots (creado_en) VALUES (?) RETURNING id"
  )
    .bind(ahora)
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

async function handlePostMedicamentos(request, env) {
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

  const listaActual = await getMedicamentos(env);

  // Solo creamos una foto nueva del histórico si la lista ha cambiado de verdad
  const ultimoSnapshot = await env.DB.prepare(
    "SELECT id FROM snapshots ORDER BY id DESC LIMIT 1"
  ).first();

  let debeCrearSnapshot = true;
  if (ultimoSnapshot) {
    const { results: medsUltimoSnapshot } = await env.DB.prepare(
      "SELECT nombre, desayuno, comida, cena, nota FROM snapshot_medicamentos WHERE snapshot_id = ?"
    )
      .bind(ultimoSnapshot.id)
      .all();
    debeCrearSnapshot = !sonIguales(medsUltimoSnapshot, nuevaLista);
  }

  if (debeCrearSnapshot && listaActual.length > 0) {
    // Guardamos cómo estaba el pastillero justo antes de este cambio, no vacío ni la lista nueva
  }

  const ahora = new Date().toISOString();

  // Reemplazamos el pastillero actual por la nueva lista
  await env.DB.prepare("DELETE FROM medicamentos").run();
  for (const m of nuevaLista) {
    await env.DB.prepare(
      `INSERT INTO medicamentos (nombre, desayuno, comida, cena, nota, actualizado_en)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(m.nombre, m.desayuno || 0, m.comida || 0, m.cena || 0, m.nota || "", ahora)
      .run();
  }

  if (debeCrearSnapshot) {
    await guardarSnapshot(env, nuevaLista);
  }

  const listaFinal = await getMedicamentos(env);
  return json({ medicamentos: listaFinal });
}

async function handleGetHistorico(env) {
  const { results: snapshots } = await env.DB.prepare(
    "SELECT id, creado_en FROM snapshots ORDER BY id DESC"
  ).all();

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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (url.pathname === "/medicamentos" && request.method === "GET") {
        const medicamentos = await getMedicamentos(env);
        return json({ medicamentos });
      }

      if (url.pathname === "/medicamentos" && request.method === "POST") {
        return await handlePostMedicamentos(request, env);
      }

      if (url.pathname === "/historico" && request.method === "GET") {
        return await handleGetHistorico(env);
      }

      return json({ error: "Ruta no encontrada" }, 404);
    } catch (err) {
      return json({ error: "Error interno: " + err.message }, 500);
    }
  },
};
