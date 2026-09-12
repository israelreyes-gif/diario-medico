// Recopila de D1 los datos necesarios para el informe PDF, según las secciones
// que el usuario haya marcado y el rango de fechas elegido.

export async function recopilarDatosInforme(env, usuarioId, secciones, inicio, fin) {
  const datos = {};

  if (secciones.includes("medicacion")) {
    const { results } = await env.DB.prepare(
      "SELECT nombre, desayuno, comida, cena, nota FROM medicamentos WHERE usuario_id = ? ORDER BY nombre ASC"
    )
      .bind(usuarioId)
      .all();
    datos.medicacion = results;
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
      if (!porDia[r.fecha]) porDia[r.fecha] = { fecha: r.fecha, registros: [], comentario: comentarioPorFecha[r.fecha] || null };
      porDia[r.fecha].registros.push({ hora: r.hora, emocion: r.emocion, intensidad: r.intensidad });
    });

    // Días que solo tienen comentario, sin ningún registro de ánimo, también se incluyen
    comentarios.forEach((c) => {
      if (!porDia[c.fecha]) porDia[c.fecha] = { fecha: c.fecha, registros: [], comentario: c.comentario };
    });

    datos.animo = Object.values(porDia).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  if (secciones.includes("constantes")) {
    const { results } = await env.DB.prepare(
      "SELECT fecha, hora, tipo, valor FROM constantes_vitales WHERE usuario_id = ? AND fecha BETWEEN ? AND ? ORDER BY tipo ASC, fecha ASC, hora ASC"
    )
      .bind(usuarioId, inicio, fin)
      .all();

    const porTipo = {};
    results.forEach((r) => {
      if (!porTipo[r.tipo]) porTipo[r.tipo] = [];
      porTipo[r.tipo].push({ fecha: r.fecha, hora: r.hora, valor: JSON.parse(r.valor) });
    });

    datos.constantes = porTipo;
  }

  return datos;
}
