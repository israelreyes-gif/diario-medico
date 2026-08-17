// Información del medicamento: ficha técnica oficial (CIMA · AEMPS)

function toggleInfo(show) {
  document.getElementById('infoOverlay').classList.toggle('show', show);
}

async function verInfo(nombre) {
  document.getElementById('infoTitle').textContent = nombre;
  const contentEl = document.getElementById('infoContent');
  contentEl.innerHTML = 'Cargando...';
  toggleInfo(true);

  try {
    const res = await fetch(`${API_URL}/medicamento-info?nombre=${encodeURIComponent(nombre)}`);
    const data = await res.json();

    if (!res.ok) {
      contentEl.innerHTML = `<p class="info-error">${data.error || 'No se encontró información para este medicamento.'}</p>`;
      return;
    }

    if (!data.secciones || data.secciones.length === 0) {
      contentEl.innerHTML = '<p class="info-empty">No hay información detallada disponible para este medicamento.</p>';
      return;
    }

    contentEl.innerHTML = data.secciones.map(s => `
      <div class="info-section">
        <h4>${s.titulo}</h4>
        <p>${s.texto}</p>
      </div>
    `).join('');
  } catch (err) {
    contentEl.innerHTML = '<p class="info-error">No se pudo cargar la información. Comprueba tu conexión.</p>';
  }
}
