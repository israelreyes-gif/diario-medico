// Estado de ánimo: montaje de la pantalla, franjas del día, calendario mensual

const MOOD_EMOTIONS = [
  { id: 'alegria', emo: '😄', label: 'Alegría' },
  { id: 'calma', emo: '😌', label: 'Calma' },
  { id: 'ilusion', emo: '🤩', label: 'Ilusión' },
  { id: 'cansancio', emo: '🥱', label: 'Cansancio' },
  { id: 'tristeza', emo: '😢', label: 'Tristeza' },
  { id: 'enfado', emo: '😠', label: 'Enfado' },
  { id: 'agobio', emo: '😖', label: 'Agobio' },
  { id: 'ansiedad', emo: '😟', label: 'Ansiedad' },
];

const MOOD_SLOTS = [
  { id: 'manana', label: 'Mañana', range: '5:00–13:00', icon: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M2 12h2"/>' },
  { id: 'tarde', label: 'Tarde', range: '13:00–20:00', icon: '<circle cx="12" cy="12" r="5"/><path d="M12 1v2"/><path d="M12 21v2"/><path d="M4.22 4.22l1.42 1.42"/><path d="M18.36 18.36l1.42 1.42"/>' },
  { id: 'noche', label: 'Noche', range: '20:00–5:00', icon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>' },
];

let moodToday = { fecha: null, manana: null, tarde: null, noche: null };
let moodDraft = { emotion: null, level: null };
let moodCalYear = new Date().getFullYear();
let moodCalMonth = new Date().getMonth() + 1; // 1-12
let moodCalData = [];

function initMoodScreen() {
  const el = document.getElementById('moodScreen');
  el.innerHTML = `
    <header>
      <div class="brand">
        <button class="back-btn" onclick="goHome()" aria-label="Volver al inicio">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div class="app-icon-sm mood">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01"/><path d="M15 9h.01"/></svg>
        </div>
        <h1>Estado de ánimo</h1>
      </div>
    </header>

    <div class="list" style="padding-bottom:40px;">

      <div class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01"/><path d="M15 9h.01"/></svg>
        Hoy
      </div>
      <p class="empty-note" id="moodTodayLabel" style="margin:-6px 0 12px;"></p>

      <div id="moodSlots"></div>

      <button class="save-btn" id="moodSaveBtn" onclick="saveMoodDraft()" disabled>Guardar estado</button>

      <div class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
        Calendario
      </div>

      <div class="cal-nav">
        <button onclick="moodChangeMonth(-1)"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>
        <span class="cal-month" id="moodCalMonthLabel"></span>
        <button onclick="moodChangeMonth(1)"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg></button>
      </div>

      <div class="cal-grid" id="moodCalGrid"></div>

      <div class="mood-legend">
        <div class="mood-legend-item"><div class="mood-legend-dot" style="background:var(--mood1)"></div>Muy bajo</div>
        <div class="mood-legend-item"><div class="mood-legend-dot" style="background:var(--mood2)"></div>Bajo</div>
        <div class="mood-legend-item"><div class="mood-legend-dot" style="background:var(--mood3)"></div>Neutro</div>
        <div class="mood-legend-item"><div class="mood-legend-dot" style="background:var(--mood4)"></div>Alto</div>
        <div class="mood-legend-item"><div class="mood-legend-dot" style="background:var(--mood5)"></div>Muy alto</div>
      </div>

      <div class="summary-row">
        <div class="mood-summary-card" onclick="alert('Resumen mensual — todavía sin funcionalidad')">
          <div class="mood-summary-icon"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg></div>
          <h4>Resumen mensual</h4>
          <p>Evolución de este mes</p>
        </div>
        <div class="mood-summary-card" onclick="alert('Resumen anual — todavía sin funcionalidad')">
          <div class="mood-summary-icon"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg></div>
          <h4>Resumen anual</h4>
          <p>Evolución de todo el año</p>
        </div>
      </div>

    </div>
  `;
}

function fechaHoyISO() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function franjaActivaAhora() {
  const hora = new Date().getHours();
  if (hora >= 5 && hora < 13) return 'manana';
  if (hora >= 13 && hora < 20) return 'tarde';
  return 'noche';
}

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

// ---------- Calendario ----------

async function loadMoodMonth(year, mes) {
  try {
    const res = await apiFetch(`/estado-animo-mes?year=${year}&mes=${mes}`);
    const data = await res.json();
    moodCalData = data.dias || [];
  } catch (err) {
    moodCalData = [];
  }
  renderMoodCalendar(year, mes);
}

function moodChangeMonth(delta) {
  moodCalMonth += delta;
  if (moodCalMonth > 12) { moodCalMonth = 1; moodCalYear++; }
  if (moodCalMonth < 1) { moodCalMonth = 12; moodCalYear--; }
  loadMoodMonth(moodCalYear, moodCalMonth);
}

function promedioDia(dia) {
  const niveles = [dia.manana, dia.tarde, dia.noche].filter(Boolean).map(f => f.intensidad);
  if (niveles.length === 0) return null;
  return Math.round(niveles.reduce((a, b) => a + b, 0) / niveles.length);
}

function colorNivel(n) {
  return { 1: 'var(--mood1)', 2: 'var(--mood2)', 3: 'var(--mood3)', 4: 'var(--mood4)', 5: 'var(--mood5)' }[n];
}

function renderMoodCalendar(year, mes) {
  const nombreMes = new Date(year, mes - 1, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  document.getElementById('moodCalMonthLabel').textContent = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);

  const primerDiaSemana = (new Date(year, mes - 1, 1).getDay() + 6) % 7; // 0 = lunes
  const diasEnMes = new Date(year, mes, 0).getDate();
  const hoyISO = fechaHoyISO();

  const datosPorFecha = {};
  moodCalData.forEach(d => { datosPorFecha[d.fecha] = d; });

  let html = ['L','M','X','J','V','S','D'].map(d => `<div class="cal-dow">${d}</div>`).join('');

  for (let i = 0; i < primerDiaSemana; i++) {
    html += '<div class="cal-day empty"></div>';
  }

  for (let dia = 1; dia <= diasEnMes; dia++) {
    const fechaISO = `${year}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const esHoy = fechaISO === hoyISO;
    const datosDia = datosPorFecha[fechaISO];
    const promedio = datosDia ? promedioDia(datosDia) : null;
    const dot = promedio ? `<div class="dot" style="background:${colorNivel(promedio)}"></div>` : '';

    html += `<div class="cal-day ${esHoy ? 'today' : ''}">${dia}${dot}</div>`;
  }

  document.getElementById('moodCalGrid').innerHTML = html;
}
