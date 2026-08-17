import { json, stripHtml } from "./utils.js";

export async function handleBuscarMedicamentos(request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();

  if (q.length < 3) {
    return json({ resultados: [] });
  }

  try {
    const cimaRes = await fetch(
      `https://cima.aemps.es/cima/rest/medicamentos?nombre=${encodeURIComponent(q)}&pagina=1`
    );
    if (!cimaRes.ok) {
      return json({ resultados: [] });
    }
    const data = await cimaRes.json();
    const resultados = (data.resultados || []).slice(0, 8).map((m) => ({
      nombre: m.nombre,
      laboratorio: m.labtitular || "",
    }));
    return json({ resultados });
  } catch (err) {
    return json({ resultados: [] });
  }
}

const SECCIONES_FICHA_TECNICA = [
  { id: "4.1", titulo: "Para qué se usa" },
  { id: "4.2", titulo: "Cómo se toma" },
  { id: "4.3", titulo: "Contraindicaciones" },
  { id: "4.5", titulo: "Interacciones con otros medicamentos" },
  { id: "4.8", titulo: "Posibles efectos adversos" },
];

export async function handleInfoMedicamento(request) {
  const url = new URL(request.url);
  const nombre = (url.searchParams.get("nombre") || "").trim();

  if (nombre.length < 3) {
    return json({ error: "Nombre de medicamento no válido." }, 400);
  }

  try {
    const buscarRes = await fetch(
      `https://cima.aemps.es/cima/rest/medicamentos?nombre=${encodeURIComponent(nombre)}&pagina=1`
    );
    if (!buscarRes.ok) return json({ error: "No se encontró información para este medicamento." }, 404);
    const buscarData = await buscarRes.json();
    const resultados = buscarData.resultados || [];
    if (resultados.length === 0) {
      return json({ error: "No se encontró información para este medicamento." }, 404);
    }

    const exacto = resultados.find((r) => r.nombre.toLowerCase() === nombre.toLowerCase());
    const medicamento = exacto || resultados[0];
    const nregistro = medicamento.nregistro;

    const secciones = [];
    for (const s of SECCIONES_FICHA_TECNICA) {
      try {
        const seccionRes = await fetch(
          `https://cima.aemps.es/cima/dochtml/ft/${nregistro}/${s.id}/FichaTecnica.html`
        );
        if (!seccionRes.ok) continue;
        const html = await seccionRes.text();
        const texto = stripHtml(html);
        if (texto && texto.length > 5) {
          secciones.push({ titulo: s.titulo, texto });
        }
      } catch (err) {
        // si una sección concreta falla, seguimos con las demás
      }
    }

    return json({
      nombre: medicamento.nombre,
      laboratorio: medicamento.labtitular || "",
      requiereReceta: !!medicamento.receta,
      secciones,
    });
  } catch (err) {
    return json({ error: "No se pudo obtener la información en este momento." }, 500);
  }
}
