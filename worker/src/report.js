import { recopilarDatosInforme } from "./report-data.js";
import { generarInformePdf } from "./report-pdf.js";
import { json } from "./utils.js";

const SECCIONES_VALIDAS = ["medicacion", "emergencia", "animo", "constantes"];

function fechaHoyISO() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function formatearRangoLabel(inicio, fin) {
  const opts = { day: "numeric", month: "long", year: "numeric" };
  const i = new Date(inicio + "T00:00:00").toLocaleDateString("es-ES", opts);
  const f = new Date(fin + "T00:00:00").toLocaleDateString("es-ES", opts);
  return `${i} — ${f}`;
}

export async function handleGenerarInformePdf(request, env, usuarioId) {
  const body = await request.json();
  const { secciones, inicio, fin, incluirHistoricoMedicacion } = body;

  if (!Array.isArray(secciones) || secciones.length === 0) {
    return json({ error: "Elige al menos una sección para el informe." }, 400);
  }
  const seccionesValidas = secciones.filter((s) => SECCIONES_VALIDAS.includes(s));
  if (seccionesValidas.length === 0) {
    return json({ error: "Ninguna de las secciones indicadas es válida." }, 400);
  }

  const necesitaRango = seccionesValidas.includes("animo") || seccionesValidas.includes("constantes");
  let inicioFinal = inicio;
  let finFinal = fin;

  if (necesitaRango) {
    if (!inicioFinal || !finFinal || !/^\d{4}-\d{2}-\d{2}$/.test(inicioFinal) || !/^\d{4}-\d{2}-\d{2}$/.test(finFinal)) {
      return json({ error: "Rango de fechas no válido, se espera YYYY-MM-DD." }, 400);
    }
    if (inicioFinal > finFinal) {
      return json({ error: "La fecha de inicio debe ser anterior a la de fin." }, 400);
    }
  } else {
    inicioFinal = fechaHoyISO();
    finFinal = fechaHoyISO();
  }

  const incluirHistorico = seccionesValidas.includes("medicacion") && incluirHistoricoMedicacion === true;

  const datos = await recopilarDatosInforme(env, usuarioId, seccionesValidas, inicioFinal, finFinal, incluirHistorico);

  const meta = {
    fechaGeneracion: new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }),
    rangoLabel: necesitaRango ? formatearRangoLabel(inicioFinal, finFinal) : null,
  };

  const pdfBytes = await generarInformePdf(datos, meta);

  return new Response(pdfBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="diario-medico-informe.pdf"',
    },
  });
}
