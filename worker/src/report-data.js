export async function recopilarDatosInforme(env, usuarioId, secciones, inicio, fin, incluirHistoricoMedicacion) {
  const datos = {};

  if (secciones.includes("medicacion")) {
    const { results } = await env.DB.prepare(
      "SELECT nombre, desayuno, comida, cena, nota FROM medicamentos WHERE usuario_id = ? ORDER BY nombre ASC"
    )
      .bind(usuarioId)
      .all();
    datos.medicacion = results;

    if (incluirHistoricoMedicacion) {
      const { results: snapshots } = await env.DB.prepare(
        "SELECT id, creado_en FROM snapshots WHERE usuario_id = ? ORDER BY creado_en ASC"
      )
        .bind(usuarioId)
        .all();

      const historico = [];
      for (const snap of snapshots) {
        const { results: meds } = await env.DB.prepare(
          "SELECT nombre, desayuno, comida, cena, nota FROM snapshot_medicamentos WHERE snapshot_id = ? ORDER BY nombre ASC"
        )
          .bind(snap.id)
          .all();
        historico.push({ fecha: snap.creado_en, medicamentos: meds });
      }
      datos.medicacionHistorico = historico;
    }
  }

  if (secciones.includes("emergencia")) {
    const fila = await env.DB.prepare(
      "SELECT grupo_sanguineo, alergias, enfermedades, contactos FROM fichas_emergencia WHERE usuario_id = ?"
    )
      .bind(usuarioId)
      .first();

    datos.emergencia = fila
      ? {
          grupoSanguineo: fila.grupo_sanguineo,
          alergias: fila.alergias ? JSON.parse(fila.alergias) : [],
          enfermedades: fila.enfermedades ? JSON.parse(fila.enfermedades) : [],
          contactos: fila.contactos ? JSON.parse(fila.contactos) : { personales: [], medicos: [] },
        }
      : null;
  }

  if (secciones.includes("animo")) {
    const { results: registros } = await env.DB.prepare(
      "SELECT fecha, hora, emocion, intensidad FROM registros_animo WHERE usuario_id = ? AND fecha BETWEEN ? AND ? ORDER BY fecha ASC, hora ASC"
    )
      .bind(usuarioId, inicio, fin)
      .all();

    const { results: comentarios } = await env.DB.prepare(
      "SELECT fecha, comentario FROM comentarios_animo WHERE usuario_id = ? AND fecha BETWEEN ? AND ? ORDER BY fecha ASC"
    )
      .bind(usuarioId, inicio, fin)
      .all();

    const comentarioPorFecha = {};
    comentarios.forEach((c) => { comentarioPorFecha[c.fecha] = c.comentario; });

    const porDia = {};
    registros.forEach((r) => {
      if (!porDia[r.fecha]) porDia[r.fecha] = { fecha: r.fecha, registros: [], comentario: comentario
