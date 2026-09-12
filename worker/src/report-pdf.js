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

export async function generarInformePdf(datos, meta) {
  const pdf = await PDFDocument.create();
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const MARGEN = 50;
  const ANCHO = 595.28; // A4
  const ALTO = 841.89;
  const COLOR_TITULO = rgb(0.12, 0.28, 0.27);
  const COLOR_TEXTO = rgb(0.2, 0.19, 0.17);
  const COLOR_SUAVE = rgb(0.43, 0.42, 0.39);
  const COLOR_LINEA = rgb(0.91, 0.88, 0.83);

  let pagina = pdf.addPage([ANCHO, ALTO]);
  let y = ALTO - MARGEN;

  function nuevaPaginaSiHaceFalta(alturaNecesaria) {
    if (y - alturaNecesaria < MARGEN) {
      pagina = pdf.addPage([ANCHO, ALTO]);
      y = ALTO - MARGEN;
    }
  }

  function escribir(texto, { tamano = 11, negrita = false, color = COLOR_TEXTO, indentacion = 0 } = {}) {
    nuevaPaginaSiHaceFalta(tamano + 6);
    pagina.drawText(texto, {
      x: MARGEN + indentacion,
      y,
      size: tamano,
      font: negrita ? fontBold : fontRegular,
      color,
    });
    y -= tamano + 6;
  }

  function lineaSeparadora() {
    nuevaPaginaSiHaceFalta(14);
    pagina.drawLine({
      start: { x: MARGEN, y },
      end: { x: ANCHO - MARGEN, y },
      thickness: 0.5,
      color: COLOR_LINEA,
    });
    y -= 14;
  }

  function tituloSeccion(texto) {
    nuevaPaginaSiHaceFalta(30);
    y -= 6;
    escribir(texto, { tamano: 15, negrita: true, color: COLOR_TITULO });
    lineaSeparadora();
  }

  // Cabecera del documento
  escribir("Diario médico — Informe", { tamano: 20, negrita: true, color: COLOR_TITULO });
  escribir(`Generado el ${meta.fechaGeneracion}`, { tamano: 9.5, color: COLOR_SUAVE });
  if (meta.rangoLabel) {
    escribir(`Periodo: ${meta.rangoLabel}`, { tamano: 9.5, color: COLOR_SUAVE });
  }
  y -= 10;

  // --- Medicación ---
  if (datos.medicacion) {
    tituloSeccion("Medicación actual");
    if (datos.medicacion.length === 0) {
      escribir("Sin medicación registrada.", { tamano: 10.5, color: COLOR_SUAVE });
    } else {
      datos.medicacion.forEach((m) => {
        escribir(m.nombre, { tamano: 11.5, negrita: true });
        const dosis = [];
        if (m.desayuno) dosis.push(`Desayuno: ${m.desayuno} comp`);
        if (m.comida) dosis.push(`Comida: ${m.comida} comp`);
        if (m.cena) dosis.push(`Cena: ${m.cena} comp`);
        escribir(dosis.join('   ·   ') || 'Sin dosis indicada', { tamano: 10, color: COLOR_SUAVE, indentacion: 10 });
        if (m.nota) escribir(`Nota: ${m.nota}`, { tamano: 9.5, color: COLOR_SUAVE, indentacion: 10 });
        y -= 4;
      });
    }
    y -= 10;
  }

  // --- Ficha de emergencia ---
  if (datos.emergencia !== undefined) {
    tituloSeccion("Ficha de emergencia");
    const e = datos.emergencia;
    if (!e) {
      escribir("Sin ficha de emergencia registrada.", { tamano: 10.5, color: COLOR_SUAVE });
    } else {
      escribir(`Grupo sanguíneo: ${e.grupoSanguineo || "No indicado"}`, { tamano: 10.5 });
      escribir(`Alergias: ${e.alergias.length ? e.alergias.join(', ') : 'Ninguna'}`, { tamano: 10.5 });
      escribir(`Enfermedades: ${e.enfermedades.length ? e.enfermedades.join(', ') : 'Ninguna'}`, { tamano: 10.5 });
      y -= 4;

      if (e.contactos.personales?.length) {
        escribir("Contactos personales:", { tamano: 10.5, negrita: true });
        e.contactos.personales.forEach((c) => {
          escribir(`${c.nombre} — ${c.telefono}`, { tamano: 10, color: COLOR_SUAVE, indentacion: 10 });
        });
      }
      if (e.contactos.medicos?.length) {
        escribir("Contactos médicos:", { tamano: 10.5, negrita: true });
        e.contactos.medicos.forEach((c) => {
          escribir(`${c.nombre} (${c.especialidad || 'Sin especialidad'}) — ${c.telefono}`, { tamano: 10, color: COLOR_SUAVE, indentacion: 10 });
        });
      }
    }
    y -= 10;
  }

  // --- Estado de ánimo, agrupado por día ---
  if (datos.animo) {
    tituloSeccion("Estado de ánimo");
    if (datos.animo.length === 0) {
      escribir("Sin registros en este periodo.", { tamano: 10.5, color: COLOR_SUAVE });
    } else {
      datos.animo.forEach((dia) => {
        nuevaPaginaSiHaceFalta(40);
        escribir(dia.fecha, { tamano: 11.5, negrita: true, color: COLOR_TITULO });
        dia.registros.forEach((r) => {
          const label = EMOCIONES_LABEL[r.emocion] || r.emocion;
          escribir(`${r.hora}  ·  ${label}  ·  Intensidad ${r.intensidad}/5`, { tamano: 10, indentacion: 10 });
        });
        if (dia.comentario) {
          escribir(`Comentario: ${dia.comentario}`, { tamano: 9.5, color: COLOR_SUAVE, indentacion: 10 });
        }
        y -= 8;
      });
    }
    y -= 10;
  }

  // --- Constantes vitales, agrupadas por tipo ---
  if (datos.constantes) {
    tituloSeccion("Constantes vitales");
    const tipos = Object.keys(datos.constantes);
    if (tipos.length === 0) {
      escribir("Sin registros en este periodo.", { tamano: 10.5, color: COLOR_SUAVE });
    } else {
      tipos.forEach((tipo) => {
        nuevaPaginaSiHaceFalta(30);
        escribir(TIPOS_VITAL_LABEL[tipo] || tipo, { tamano: 11.5, negrita: true, color: COLOR_TITULO });
        datos.constantes[tipo].forEach((r) => {
          escribir(`${r.fecha}  ${r.hora}  ·  ${formatVitalValor(tipo, r.valor)}`, { tamano: 10, indentacion: 10 });
        });
        y -= 8;
      });
    }
  }

  // Pie de página con aviso, en todas las páginas
  const paginas = pdf.getPages();
  paginas.forEach((p, i) => {
    p.drawText(
      "Informe generado por la app Diario médico a partir de datos de autoseguimiento. No sustituye un informe clínico.",
      { x: MARGEN, y: 25, size: 7.5, font: fontRegular, color: COLOR_SUAVE }
    );
    p.drawText(`${i + 1} / ${paginas.length}`, { x: ANCHO - MARGEN - 30, y: 25, size: 7.5, font: fontRegular, color: COLOR_SUAVE });
  });

  return pdf.save();
}
