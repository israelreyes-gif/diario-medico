import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const EMOCIONES_LABEL = {
  alegria: "Alegría", calma: "Calma", ilusion: "Ilusión", cansancio: "Cansancio",
  tristeza: "Tristeza", enfado: "Enfado", agobio: "Agobio", ansiedad: "Ansiedad",
};

const TIPOS_VITAL_LABEL = {
  tension: "Tensión arterial", frecuencia_cardiaca: "Frecuencia cardíaca",
  glucosa: "Glucosa", peso: "Peso", temperatura: "Temperatura",
};

const TIPOS_VITAL_UNIDAD = {
  tension: "mmHg", frecuencia_cardiaca: "lpm", glucosa: "mg/dL", peso: "kg", temperatura: "°C",
};

function formatVitalValor(tipo, valor) {
  if (tipo === "tension") return `${valor.sistolica}/${valor.diastolica} ${TIPOS_VITAL_UNIDAD[tipo]}`;
  return `${valor.valor} ${TIPOS_VITAL_UNIDAD[tipo]}`;
}

function formatFechaHistorico(fechaISO) {
  try {
    return new Date(fechaISO).toLocaleString("es-ES", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch (err) {
    return fechaISO;
  }
}

export async function generarInformePdf(datos, meta) {
  const pdf = await PDFDocument.create();
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const MARGEN = 50;
  const ANCHO = 595.28; // A4
  const ALTO = 841.89;

  const COLOR_TEAL_DEEP = rgb(0.118, 0.278, 0.267);
  const COLOR_TEAL = rgb(0.173, 0.373, 0.357);
  const COLOR_TEXTO = rgb(0.2, 0.19, 0.17);
  const COLOR_SUAVE = rgb(0.43, 0.42, 0.39);
  const COLOR_LINEA = rgb(0.91, 0.88, 0.83);
  const COLOR_FONDO_SUAVE = rgb(0.98, 0.965, 0.945);
  const COLOR_BLANCO = rgb(1, 1, 1);

  const COLOR_MEDS = rgb(0.851, 0.643, 0.251);
  const COLOR_EMERGENCIA = rgb(0.698, 0.231, 0.231);
  const COLOR_ANIMO = rgb(0.42, 0.357, 0.584);
  const COLOR_VITALS = COLOR_TEAL;

  let pagina = pdf.addPage([ANCHO, ALTO]);
  let y = ALTO - MARGEN;
  const ANCHO_UTIL = ANCHO - MARGEN * 2;

  function nuevaPagina() {
    pagina = pdf.addPage([ANCHO, ALTO]);
    y = ALTO - MARGEN;
  }

  function nuevaPaginaSiHaceFalta(alturaNecesaria) {
    if (y - alturaNecesaria < MARGEN) nuevaPagina();
  }

  function escribir(texto, { tamano = 11, negrita = false, color = COLOR_TEXTO, x = MARGEN, avanzarY = true } = {}) {
    pagina.drawText(texto, { x, y, size: tamano, font: negrita ? fontBold : fontRegular, color });
    if (avanzarY) y -= tamano + 6;
  }

  function alturaBloque(numLineas, tamano = 10) {
    return numLineas * (tamano + 6);
  }

  function tarjeta(alturaContenido, colorBarra) {
    const alturaTotal = alturaContenido + 16;
    nuevaPaginaSiHaceFalta(alturaTotal + 10);
    const yTop = y;
    pagina.drawRectangle({
      x: MARGEN, y: yTop - alturaTotal, width: ANCHO_UTIL, height: alturaTotal,
      color: COLOR_FONDO_SUAVE,
    });
    pagina.drawRectangle({
      x: MARGEN, y: yTop - alturaTotal, width: 4, height: alturaTotal,
      color: colorBarra,
    });
    y = yTop - 10;
    return yTop - alturaTotal - 10;
  }

  function cerrarTarjeta(limiteInferior) {
    y = limiteInferior - 4;
  }

  function tituloSeccion(texto, colorBanda) {
    nuevaPaginaSiHaceFalta(40);
    y -= 4;
    pagina.drawRectangle({ x: MARGEN, y: y - 6, width: 26, height: 16, color: colorBanda });
    escribir(texto, { tamano: 15, negrita: true, color: COLOR_TEAL_DEEP, x: MARGEN + 34, avanzarY: false });
    y -= 26;
  }

  function subtituloSeccion(texto, colorBanda) {
    nuevaPaginaSiHaceFalta(28);
    y -= 6;
    pagina.drawRectangle({ x: MARGEN, y: y - 4, width: 18, height: 12, color: colorBanda });
    escribir(texto, { tamano: 12.5, negrita: true, color: COLOR_TEAL_DEEP, x: MARGEN + 26, avanzarY: false });
    y -= 20;
  }

  // --- Cabecera de portada ---
  pagina.drawRectangle({ x: 0, y: ALTO - 90, width: ANCHO, height: 90, color: COLOR_TEAL_DEEP });
  pagina.drawText("Diario médico", { x: MARGEN, y: ALTO - 45, size: 22, font: fontBold, color: COLOR_BLANCO });
  pagina.drawText("Informe de seguimiento", { x: MARGEN, y: ALTO - 68, size: 11, font: fontRegular, color: rgb(0.85, 0.85, 0.85) });
  y = ALTO - 115;

  escribir(`Generado el ${meta.fechaGeneracion}`, { tamano: 9.5, color: COLOR_SUAVE });
  if (meta.rangoLabel) {
    escribir(`Periodo (ánimo y constantes): ${meta.rangoLabel}`, { tamano: 9.5, color: COLOR_SUAVE });
  }
  y -= 12;

  // --- Medicación ---
  if (datos.medicacion) {
    tituloSeccion("Medicación actual", COLOR_MEDS);
    if (datos.medicacion.length === 0) {
      escribir("Sin medicación registrada.", { tamano: 10.5, color: COLOR_SUAVE });
    } else {
      datos.medicacion.forEach((m) => {
        const dosis = [];
        if (m.desayuno) dosis.push(`Desayuno: ${m.desayuno} comp`);
        if (m.comida) dosis.push(`Comida: ${m.comida} comp`);
        if (m.cena) dosis.push(`Cena: ${m.cena} comp`);
        const lineas = 1 + (dosis.length ? 1 : 0) + (m.nota ? 1 : 0);

        const limite = tarjeta(alturaBloque(lineas), COLOR_MEDS);
        escribir(m.nombre, { tamano: 11.5, negrita: true, x: MARGEN + 14 });
        if (dosis.length) escribir(dosis.join('   ·   '), { tamano: 10, color: COLOR_SUAVE, x: MARGEN + 14 });
        if (m.nota) escribir(`Nota: ${m.nota}`, { tamano: 9.5, color: COLOR_SUAVE, x: MARGEN + 14 });
        cerrarTarjeta(limite);
      });
    }
    y -= 6;

    // --- Histórico de cambios de medicación (subsección opcional) ---
    if (datos.medicacionHistorico) {
      subtituloSeccion("Histórico de cambios", COLOR_MEDS);
      if (datos.medicacionHistorico.length === 0) {
        escribir("Sin cambios registrados en el histórico.", { tamano: 10, color: COLOR_SUAVE });
      } else {
        datos.medicacionHistorico.forEach((snap) => {
          const lineas = 1 + Math.max(snap.medicamentos.length, 1);
          const limite = tarjeta(alturaBloque(lineas), COLOR_MEDS);

          escribir(formatFechaHistorico(snap.fecha), { tamano: 10.5, negrita: true, color: COLOR_TEAL_DEEP, x: MARGEN + 14 });
          if (snap.medicamentos.length === 0) {
            escribir("Sin medicación en este momento.", { tamano: 9.5, color: COLOR_SUAVE, x: MARGEN + 24 });
          } else {
            snap.medicamentos.forEach((m) => {
              const dosis = [];
              if (m.desayuno) dosis.push(`D:${m.desayuno}`);
              if (m.comida) dosis.push(`C:${m.comida}`);
              if (m.cena) dosis.push(`N:${m.cena}`);
              escribir(`${m.nombre}${dosis.length ? '  (' + dosis.join(' · ') + ')' : ''}`, { tamano: 9.5, x: MARGEN + 24 });
            });
          }
          cerrarTarjeta(limite);
        });
      }
      y -= 6;
    }
  }

  // --- Ficha de emergencia ---
  if (datos.emergencia !== undefined) {
    tituloSeccion("Ficha de emergencia", COLOR_EMERGENCIA);
    const e = datos.emergencia;
    if (!e) {
      escribir("Sin ficha de emergencia registrada.", { tamano: 10.5, color: COLOR_SUAVE });
    } else {
      const contactosPersonales = e.contactos.personales || [];
      const contactosMedicos = e.contactos.medicos || [];
      const lineas = 3
        + (contactosPersonales.length ? 1 + contactosPersonales.length : 0)
        + (contactosMedicos.length ? 1 + contactosMedicos.length : 0);

      const limite = tarjeta(alturaBloque(lineas), COLOR_EMERGENCIA);
      escribir(`Grupo sanguíneo: ${e.grupoSanguineo || "No indicado"}`, { tamano: 10.5, x: MARGEN + 14 });
      escribir(`Alergias: ${e.alergias.length ? e.alergias.join(', ') : 'Ninguna'}`, { tamano: 10.5, x: MARGEN + 14 });
      escribir(`Enfermedades: ${e.enfermedades.length ? e.enfermedades.join(', ') : 'Ninguna'}`, { tamano: 10.5, x: MARGEN + 14 });

      if (contactosPersonales.length) {
        escribir("Contactos personales:", { tamano: 10.5, negrita: true, x: MARGEN + 14 });
        contactosPersonales.forEach((c) => {
          escribir(`${c.nombre} — ${c.telefono}`, { tamano: 10, color: COLOR_SUAVE, x: MARGEN + 24 });
        });
      }
      if (contactosMedicos.length) {
        escribir("Contactos médicos:", { tamano: 10.5, negrita: true, x: MARGEN + 14 });
        contactosMedicos.forEach((c) => {
          escribir(`${c.nombre} (${c.especialidad || 'Sin especialidad'}) — ${c.telefono}`, { tamano: 10, color: COLOR_SUAVE, x: MARGEN + 24 });
        });
      }
      cerrarTarjeta(limite);
    }
    y -= 6;
  }

  // --- Estado de ánimo, agrupado por día ---
  if (datos.animo) {
    tituloSeccion("Estado de ánimo", COLOR_ANIMO);
    if (datos.animo.length === 0) {
      escribir("Sin registros en este periodo.", { tamano: 10.5, color: COLOR_SUAVE });
    } else {
      datos.animo.forEach((dia) => {
        const lineas = 1 + dia.registros.length + (dia.comentario ? 1 : 0);
        const limite = tarjeta(alturaBloque(lineas), COLOR_ANIMO);

        escribir(dia.fecha, { tamano: 11.5, negrita: true, color: COLOR_TEAL_DEEP, x: MARGEN + 14 });
        dia.registros.forEach((r) => {
          const label = EMOCIONES_LABEL[r.emocion] || r.emocion;
          escribir(`${r.hora}  ·  ${label}  ·  Intensidad ${r.intensidad}/5`, { tamano: 10, x: MARGEN + 24 });
        });
        if (dia.comentario) {
          escribir(`Comentario: ${dia.comentario}`, { tamano: 9.5, color: COLOR_SUAVE, x: MARGEN + 24 });
        }
        cerrarTarjeta(limite);
      });
    }
    y -= 6;
  }

  // --- Constantes vitales, agrupadas por tipo ---
  if (datos.constantes) {
    tituloSeccion("Constantes vitales", COLOR_VITALS);
    const tipos = Object.keys(datos.constantes);
    if (tipos.length === 0) {
      escribir("Sin registros en este periodo.", { tamano: 10.5, color: COLOR_SUAVE });
    } else {
      tipos.forEach((tipo) => {
        const registros = datos.constantes[tipo];
        const lineas = 1 + registros.length;
        const limite = tarjeta(alturaBloque(lineas), COLOR_VITALS);

        escribir(TIPOS_VITAL_LABEL[tipo] || tipo, { tamano: 11.5, negrita: true, color: COLOR_TEAL_DEEP, x: MARGEN + 14 });
        registros.forEach((r) => {
          escribir(`${r.fecha}  ${r.hora}  ·  ${formatVitalValor(tipo, r.valor)}`, { tamano: 10, x: MARGEN + 14 });
        });
        cerrarTarjeta(limite);
      });
    }
  }

  // Pie de página con aviso, en todas las páginas
  const paginas = pdf.getPages();
  paginas.forEach((p, i) => {
    p.drawLine({ start: { x: MARGEN, y: 38 }, end: { x: ANCHO - MARGEN, y: 38 }, thickness: 0.5, color: COLOR_LINEA });
    p.drawText(
      "Informe generado por la app Diario médico a partir de datos de autoseguimiento. No sustituye un informe clínico.",
      { x: MARGEN, y: 24, size: 7.5, font: fontRegular, color: COLOR_SUAVE }
    );
    p.drawText(`${i + 1} / ${paginas.length}`, { x: ANCHO - MARGEN - 30, y: 24, size: 7.5, font: fontRegular, color: COLOR_SUAVE });
  });

  return pdf.save();
}
