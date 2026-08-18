// Registro de hoy: franja activa según la hora, franjas bloqueadas de solo lectura, guardado

let moodToday = { fecha: null, manana: null, tarde: null, noche: null };
let moodDraft = { emotion: null, level: null };

async function loadMoodToday() {
  const fecha = fechaHoyISO();
  document.getElementById('moodTodayLabel').textContent =
    new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  try {
    const res = await apiFetch(`/estado-animo?fecha=${fecha}`);
    const data = await res.json();
    moodToday = data;
  } catch (err) {
    moodToday = { fecha, manana: null, tarde: null, noche: null };
  }

  renderMoodSlots();
  await loadMoodMonth(moodCalYear, moodCalMonth);
}

function renderMoodSlots() {
  const activa = franjaActivaAhora();
  const container = document.getElementById('moodSlots');
  container.innerHTML = '';

  MOOD_SLOTS.forEach(slot => {
    const isActive = slot.id === activa;
    const saved = moodToday[slot.id];
    const card = document.createElement('div');
    card.className = 'slot-card' + (isActive ? '' : ' locked');

    if (isActive) {
      moodDraft = saved ? { emotion: saved.emocion, level: saved.intensidad } : { emotion: null, level: null };

      card.innerHTML = `
        <div class="slot-head">
          <div class="slot-head-left"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${slot.icon}</svg><span>${slot.label}</span></div>
          <div class="slot-badge active">Disponible ahora</div>
        </div>
        <div class="emotion-grid" id="moodEmoGrid">
          ${MOOD_EMOTIONS.map(e => `
            <div class="emotion-btn ${moodDraft.emotion === e.id ? 'selected' : ''}" onclick="selectMoodEmotion('${e.id}')">
              <span class="emo">${e.emo}</span><span class="lbl">${e.label}</span>
            </div>`).join('')}
        </div>
        <div class="intensity-label">Intensidad</div>
        <div class="intensity-bar" id="moodIntBar">
          ${[1,2,3,4,5].map(n => `<div class="intensity-seg i${n} ${moodDraft.level === n ? 'selected' : ''}" onclick="selectMoodLevel(${n})"></div>`).join('')}
        </div>
        <div class="intensity-labels"><span>Muy bajo</span><span>Muy alto</span></div>
      `;
    } else {
      const lockBadge = `<div class="slot-badge locked"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>${slot.range}</div>`;

      const body = saved
        ? `<div class="locked-summary">
             <span class="emo">${MOOD_EMOTIONS.find(e => e.id === saved.emocion)?.emo || '❓'}</span>
             <div class="info">
               <div class="name">${MOOD_EMOTIONS.find(e => e.id === saved.emocion)?.label || saved.emocion}</div>
               <div class="level">Intensidad ${saved.intensidad} de 5</div>
             </div>
           </div>`
        : `<div class="locked-empty">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
             Aún no registrado — se desbloqueará en su horario
           </div>`;

      card.innerHTML = `
        <div class="slot-head">
          <div class="slot-head-left"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${slot.icon}</svg><span>${slot.label}</span></div>
          ${lockBadge}
        </div>
        ${body}
      `;
    }

    container.appendChild(card);
  });

  updateMoodSaveButton();
}

function selectMoodEmotion(emotionId) {
  moodDraft.emotion = emotionId;
  document.querySelectorAll('#moodEmoGrid .emotion-btn').forEach(btn => btn.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
  updateMoodSaveButton();
}

function selectMoodLevel(level) {
  moodDraft.level = level;
  document.querySelectorAll('#moodIntBar .intensity-seg').forEach(seg => seg.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
  updateMoodSaveButton();
}

function updateMoodSaveButton() {
  const btn = document.getElementById('moodSaveBtn');
  if (btn) btn.disabled = !(moodDraft.emotion && moodDraft.level);
}

async function saveMoodDraft() {
  const btn = document.getElementById('moodSaveBtn');
  const franja = franjaActivaAhora();
  btn.disabled = true;
  btn.textContent = 'Guardando...';

  try {
    const res = await apiFetch('/estado-animo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fecha: fechaHoyISO(),
        franja,
        emocion: moodDraft.emotion,
        intensidad: moodDraft.level,
        horaLocal: new Date().getHours(),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al guardar');
    moodToday = data;
    renderMoodSlots();
    await loadMoodMonth(moodCalYear, moodCalMonth);
  } catch (err) {
    alert('No se pudo guardar: ' + err.message);
  } finally {
    btn.textContent = 'Guardar estado';
    updateMoodSaveButton();
  }
}
