// Hoja de detalle de un día del calendario: emociones registradas ese día (solo lectura)
// y un comentario de texto libre, editable si el día no es futuro.

let dayDetailFecha = null;

function openDayDetail(fecha) {
  dayDetailFecha = fecha;
  document.getElementById('dayDetailOverlay').classList.add('show');
  loadDayDetail(fecha);
}

function toggleDayDetail(show) {
  document.getElementById('dayDetailOverlay').classList.toggle('show', show);
}

async function loadDayDetail(fecha) {
  const contenido = document.getElementById('dayDetailContent');
  contenido.innerHTML = 'Cargando...';

  const fechaObj = new Date(fecha + 'T00:00:00');
  let titulo = fechaObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  titulo = titulo.charAt(0).toUpperCase() + titulo.slice(1);
  document.getElementById('dayDetailTitle').textContent = titulo;

  try {
    const [resDia, resComentario] = await Promise.all([
      apiFetch(`/animo-dia?fecha=${fecha}`),
      apiFetch(`/animo-comentario?fecha=${fecha}`),
    ]);
    const dataDia = await resDia.json();
    const dataComentario = await resComentario.json();

    renderDayDetail(dataDia.registros || [], dataComentario.comentario || '');
  } catch (err) {
    contenido.innerHTML = '<p class="info-error">No se pudo cargar este día.</p>';
  }
}

function renderDayDetail(registros, comentario) {
  const emocionesHtml = registros.length
    ? registros.map(r => {
        const meta = MOOD_EMOTIONS.find(e => e.id === r.emocion);
        return `
          <div class="day-detail-emo-row">
            <span class="emo">${meta?.emo || '❓'}</span>
            <div class="info">
              <div class="name">${meta?.label || r.emocion} · Intensidad ${r.intensidad}</div>
            </div>
            <span class="hora">${r.hora}</span>
          </div>
        `;
      }).join('')
    : '<p class="empty-note">No hay registros de ánimo este día.</p>';

  document.getElementById('dayDetailContent').innerHTML = `
    <div class="section-title" style="margin-top:2px;">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01"/><path d="M15 9h.01"/></svg>
      Emociones registradas
    </div>
    ${emocionesHtml}

    <div class="section-title">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      Comentario del día
    </div>
    <textarea class="day-comment-textarea" id="dayCommentTextarea" placeholder="Escribe aquí cómo te sentiste este día...">${comentario}</textarea>
    <button class="save-btn" id="dayCommentSaveBtn" style="margin-top:12px;" onclick="guardarComentarioDia()">Guardar comentario</button>
  `;
}

async function guardarComentarioDia() {
  const texto = document.getElementById('dayCommentTextarea').value.trim();
  if (!texto) {
    alert('El comentario no puede estar vacío.');
    return;
  }

  const btn = document.getElementById('dayCommentSaveBtn');
  btn.disabled = true;
  btn.textContent = 'Guardando...';

  try {
    const res = await apiFetch('/animo-comentario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fecha: dayDetailFecha, comentario: texto }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al guardar');

    await loadMoodMonth(moodCalYear, moodCalMonth); // refresca la marca del calendario
  } catch (err) {
    alert('No se pudo guardar: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Guardar comentario';
  }
}
