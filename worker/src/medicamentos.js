import { json } from "./utils.js";

export async function getMedicamentos(env, usuarioId) {
  const { results } = await env.DB.prepare(
    "SELECT id, nombre, desayuno, comida, cena, nota FROM medicamentos WHERE usuario_id = ? ORDER BY id ASC"
  )
    .bind(usuarioId)
    .all();
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

async function guardarSnapshot(env, usuarioId, medicamentos) {
  const ahora = new Date().toISOString();
  const snapshotResult = await env.DB.prepare(
    "INSERT INTO snapshots (creado_en, usuario_id) VALUES (?, ?) RETURNING id"
  )
    .bind(ahora, usuarioId)
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

export async function handlePostMedicamentos(request, env, usuarioId) {
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

  const ultimoSnapshot = await env.DB.prepare(
    "SELECT id FROM snapshots WHERE usuario_id = ? ORDER BY id DESC LIMIT 1"
  )
    .bind(usuarioId)
    .first();

  let debeCrearSnapshot = true;
  if (ultimoSnapshot) {
    const { results: medsUltimoSnapshot } = await env.DB.prepare(
      "SELECT nombre, desayuno, comida, cena, nota FROM snapshot_medicamentos WHERE snapshot_id = ?"
    )
      .bind(ultimoSnapshot.id)
      .all();
    debeCrearSnapshot = !sonIguales(medsUltimoSnapshot, nuevaLista);
  }

  const ahora = new Date().toISOString();

  await env.DB.prepare("DELETE FROM medicamentos WHERE usuario_id = ?").bind(usuarioId).run();
  for (const m of nuevaLista) {
    await env.DB.prepare(
      `INSERT INTO medicamentos (nombre, desayuno, comida, cena, nota, actualizado_en, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(m.nombre, m.desayuno || 0, m.comida || 0, m.cena || 0, m.nota || "", ahora, usuarioId)
      .run();
  }

  if (debeCrearSnapshot) {
    await guardarSnapshot(env, usuarioId, nuevaLista);
  }

  const listaFinal = await getMedicamentos(env, usuarioId);
  return json({ medicamentos: listaFinal });
}

export async function handleGetHistorico(env, usuarioId) {
  const { results: snapshots } = await env.DB.prepare(
    "SELECT id, creado_en FROM snapshots WHERE usuario_id = ? ORDER BY id DESC"
  )
    .bind(usuarioId)
    .all();

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
