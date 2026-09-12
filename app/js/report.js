// Exportar informe PDF: selector de secciones y rango de fechas, pide el PDF al Worker y lo descarga.

function fechaHaceUnMesISO() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return toISO(d);
}

function openReportForm() {
  document.getElementById('reportSecMedicacion').checked = true;
  document.getElementById('reportSecEmergencia').checked = true;
  document.getElementById('reportSecAnimo').checked = true;
  document.getElementById('reportSecConstantes').checked = true;
  document.getElementById('reportInicio').value = fechaHaceUnMesISO();
  document.getElementById('reportFin').value = fechaHoyISO();
  updateReportRangeVisibility();
  document.getElementById('reportFormOverlay').classList.add('show');
}

function closeReportForm() {
  document.getElementById('reportFormOverlay').classList.remove('show');
}

// El rango de fechas solo hace falta si se ha marcado Ánimo o Constantes
function updateReportRangeVisibility() {
  const animo = document.getElementById('reportSecAnimo').checked;
  const constantes = document.getElementById('reportSecConstantes').checked;
  const rangeBlock = document.getElementById('reportRangeBlock');
  rangeBlock.style.display = (animo || constantes) ? 'block' : 'none';
}

async function generarInformePdf() {
  const secciones = [];
  if (document.getElementById('reportSecMedicacion').checked) secciones.push('medicacion');
  if (document.getElementById('reportSecEmergencia').checked) secciones.push('emergencia');
  if (document.getElementById('reportSecAnimo').checked) secciones.push('animo');
  if (document.getElementById('reportSecConstantes').checked) secciones.push('constantes');

  if (secciones.length === 0) {
    alert('Elige al menos una sección para el informe.');
    return;
  }

  const inicio = document.getElementById('reportInicio').value;
  const fin = document.getElementById('reportFin').value;

  if ((secciones.includes('animo') || secciones.includes('constantes')) && (!inicio || !fin)) {
    alert('Elige un rango de fechas.');
    return;
  }

  const btn = document.getElementById('reportGenerateBtn');
  btn.disabled = true;
  btn.textContent = 'Generando...';

  try {
    const res = await apiFetch('/informe-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secciones, inicio, fin }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'No se pudo generar el informe.');
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diario-medico-informe.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    closeReportForm();
  } catch (err) {
    alert('No se pudo generar el informe: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Generar y descargar PDF';
  }
}
