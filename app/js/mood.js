// Estado de ánimo: montaje de la pantalla, franjas del día, calendario mensual, resúmenes semanal, mensual y anual

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

let moodSummaryType = 'month'; // 'week' | 'month' | 'year'
let moodSummaryDate = new Date();

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
        <div class="mood-legend-item"><div class="mood-legend-dot" style="background:var(--mood3)"></div>Neutro</div>
        <div class="mood-legend-item"><div class="mood-legend-dot" style="background:var(--mood2)"></div>Transición</div>
        <div class="mood-legend-item"><div class="mood-legend-dot" style="background:var(--mood1)"></div>Extremo (alto o bajo)</div>
      </div>

      <div class="summary-row">
        <div class="mood-summary-card" onclick="openMoodSummary('week')">
          <div class="mood-summary-icon"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg></div>
          <h4>Resumen semanal</h4>
          <p>Evolución de esta semana</p>
        </div>
        <div class="mood-summary-card" onclick="openMoodSummary('month')">
          <div class="mood-summary-icon"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg></div>
          <h4>Resumen mensual</h4>
          <p>Evolución de este mes</p>
        </div>
      </div>

      <div class="mood-summary-card" style="margin-top:10px;" onclick="openMoodSummary('year')">
        <div class="mood-summary-icon"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/></svg></div>
        <h4>Resumen anual</h4>
        <p>Evolución de todo el año</p>
      </div>

    </div>
  `;
}

function fechaHoyISO() {
  return toISO(new Date());
}

function toISO(d) {
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

  const primerDiaSemana = (new Date(year, mes - 1, 1).getDay() + 6) % 7;
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

// ---------- Resúmenes (semanal / mensual / anual) ----------

function openMoodSummary(type) {
  moodSummaryType = type;
  moodSummaryDate = new Date();
  document.getElementById('moodSummaryOverlay').classList.add('show');
  loadMoodSummary();
}

function toggleMoodSummary(show) {
  document.getElementById('moodSummaryOverlay').classList.toggle('show', show);
}

function moodSummaryChangePeriod(delta) {
  const d = new Date(moodSummaryDate);
  if (moodSummaryType === 'week') {
    d.setDate(d.getDate() + delta * 7);
  } else if (moodSummaryType === 'month') {
    d.setMonth(d.getMonth() + delta);
  } else {
    d.setFullYear(d.getFullYear() + delta);
  }
  moodSummaryDate = d;
  loadMoodSummary();
}

function getMoodSummaryRange() {
  if (moodSummaryType === 'week') {
    const d = new Date(moodSummaryDate);
    const dow = d.getDay();
    const diffToMonday = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const opts = { day: 'numeric', month: 'short' };
    const label = `${monday.toLocaleDateString('es-ES', opts)} – ${sunday.toLocaleDateString('es-ES', opts)}`;

    return { inicio: toISO(monday), fin: toISO(sunday), totalDias: 7, label };
  }

  if (moodSummaryType === 'year') {
    const year = moodSummaryDate.getFullYear();
    const primerDia = new Date(year, 0, 1);
    const ultimoDia = new Date(year, 11, 31);
    const totalDias = Math.round((ultimoDia - primerDia) / (1000 * 60 * 60 * 24)) + 1;

    return { inicio: toISO(primerDia), fin: toISO(ultimoDia), totalDias, label: String(year) };
  }

  const year = moodSummaryDate.getFullYear();
  const mes = moodSummaryDate.getMonth();
  const primerDia = new Date(year, mes, 1);
  const ultimoDia = new Date(year, mes + 1, 0);
  let label = primerDia.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  label = label.charAt(0).toUpperCase() + label.slice(1);

  return { inicio: toISO(primerDia), fin: toISO(ultimoDia), totalDias: ultimoDia.getDate(), label };
}

async function loadMoodSummary() {
  const range = getMoodSummaryRange();
  const titulos = { week: 'Resumen semanal', month: 'Resumen mensual', year: 'Resumen anual' };
  document.getElementById('moodSummaryTitle').textContent = titulos[moodSummaryType];
  const content = document.getElementById('moodSummaryContent');
  content.innerHTML = 'Cargando...';

  try {
    const res = await apiFetch(`/estado-animo-rango?inicio=${range.inicio}&fin=${range.fin}`);
    const data = await res.json();
    renderMoodSummary(range, data.dias || []);
  } catch (err) {
    content.innerHTML = '<p class="info-error">No se pudo cargar el resumen.</p>';
  }
}

function nivelLabelTexto(n) {
  if (n === null) return 'Sin datos';
  const r = Math.round(n);
  return { 1: 'Muy bajo', 2: 'Bajo', 3: 'Neutro', 4: 'Alto', 5: 'Muy alto' }[r] || 'Neutro';
}

function colorPorDistanciaAlCentro(n) {
  const dist = Math.abs(n - 3);
  if (dist >= 1.5) return 'var(--mood1)';
  if (dist >= 0.5) return 'var(--mood2)';
  return 'var(--mood3)';
}

function renderMoodSummary(range, dias) {
  const porFecha = {};
  dias.forEach(d => { porFecha[d.fecha] = d; });

  const puntos = [];
  const cur = new Date(range.inicio + 'T00:00:00');
  const finD = new Date(range.fin + 'T00:00:00');
  while (cur <= finD) {
    const fechaISO = toISO(cur);
    const dia = porFecha[fechaISO];
    let avg = null;
    if (dia) {
      const niveles = [dia.manana, dia.tarde, dia.noche].filter(Boolean).map(f => f.intensidad);
      if (niveles.length) avg = niveles.reduce((a, b) => a + b, 0) / niveles.length;
    }
    puntos.push({ fecha: fechaISO, avg });
    cur.setDate(cur.getDate() + 1);
  }

  const valoresValidos = puntos.filter(p => p.avg !== null).map(p => p.avg);
  const mediaGlobal = valoresValidos.length ? valoresValidos.reduce((a, b) => a + b, 0) / valoresValidos.length : null;

  const counts = {};
  dias.forEach(d => {
    ['manana', 'tarde', 'noche'].forEach(f => {
      if (d[f]) counts[d[f].emocion] = (counts[d[f].emocion] || 0) + 1;
    });
  });
  const totalRegistros = Object.values(counts).reduce((a, b) => a + b, 0);
  const emocionesOrdenadas = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const maxCount = emocionesOrdenadas.length ? emocionesOrdenadas[0][1] : 0;

  const totalFranjas = range.totalDias * 3;
  const coveragePct = totalFranjas ? Math.round((totalRegistros / totalFranjas) * 100) : 0;

  let variabilidadTexto = 'Todavía no hay suficientes registros para valorar la evolución.';
  if (valoresValidos.length >= 2) {
    const varianza = valoresValidos.reduce((acc, v) => acc + Math.pow(v - mediaGlobal, 2), 0) / valoresValidos.length;
    const desviacion = Math.sqrt(varianza);
    if (desviacion < 0.5) variabilidadTexto = 'Este periodo ha sido bastante estable, sin grandes cambios entre registros.';
    else if (desviacion < 1.1) variabilidadTexto = 'Este periodo ha tenido algunos altibajos moderados.';
    else variabilidadTexto = 'Este periodo ha tenido bastantes altibajos, con cambios marcados entre registros.';
  }

  const w = 300, h = 90, padTop = 10, padBottom = 10;
  const n = puntos.length;
  const xStep = n > 1 ? w / (n - 1) : w;
  const scaleY = v => padTop + ((5 - v) / 4) * (h - padTop - padBottom);

  let segments = [];
  let currentSeg = [];
  puntos.forEach((p, i) => {
    const x = i * xStep;
    if (p.avg === null) {
      if (currentSeg.length) { segments.push(currentSeg); currentSeg = []; }
    } else {
      currentSeg.push(`${x.toFixed(1)},${scaleY(p.avg).toFixed(1)}`);
    }
  });
  if (currentSeg.length) segments.push(currentSeg);

  // En el anual hay muchos puntos (365) — usar líneas más finas y sin círculo en cada uno,
  // solo marcar el punto más alto y el más bajo del año para no saturar el gráfico.
  const strokeWidth = moodSummaryType === 'year' ? 1.6 : 2.5;
  const polylines = segments
    .map(seg => `<polyline fill="none" stroke="#6B5B95" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round" points="${seg.join(' ')}"/>`)
    .join('');

  let circles;
  if (moodSummaryType === 'year') {
    let idxMax = -1, idxMin = -1;
    puntos.forEach((p, i) => {
      if (p.avg === null) return;
      if (idxMax === -1 || p.avg > puntos[idxMax].avg) idxMax = i;
      if (idxMin === -1 || p.avg < puntos[idxMin].avg) idxMin = i;
    });
    circles = [idxMax, idxMin]
      .filter(i => i !== -1)
      .map(i => {
        const x = i * xStep;
        const y = scaleY(puntos[i].avg);
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${colorPorDistanciaAlCentro(puntos[i].avg)}"/>`;
      })
      .join('');
  } else {
    circles = puntos
      .map((p, i) => {
        if (p.avg === null) return '';
        const x = i * xStep;
        const y = scaleY(p.avg);
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="${colorPorDistanciaAlCentro(p.avg)}"/>`;
      })
      .join('');
  }

  let xLabelsHtml;
  if (moodSummaryType === 'week') {
    xLabelsHtml = puntos
      .map(p => `<span>${new Date(p.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short' }).charAt(0).toUpperCase()}</span>`)
      .join('');
  } else if (moodSummaryType === 'year') {
    const meses = ['E','F','M','A','M','J','J','A','S','O','N','D'];
    xLabelsHtml = meses.map(m => `<span>${m}</span>`).join('');
  } else {
    const idxs = new Set([0, Math.floor((n - 1) / 3), Math.floor(((n - 1) * 2) / 3), n - 1]);
    xLabelsHtml = puntos
      .map((p, i) => (idxs.has(i) ? `<span>${new Date(p.fecha + 'T00:00:00').getDate()}</span>` : '<span></span>'))
      .join('');
  }

  const emotionBarsHtml = emocionesOrdenadas.length
    ? emocionesOrdenadas
        .map(([id, count]) => {
          const meta = MOOD_EMOTIONS.find(e => e.id === id);
          const pct = maxCount ? Math.round((count / maxCount) * 100) : 0;
          return `<div class="emotion-bar-row">
            <span class="emotion-bar-emo">${meta?.emo || '❓'}</span>
            <span class="emotion-bar-label">${meta?.label || id}</span>
            <div class="emotion-bar-track"><div class="emotion-bar-fill" style="width:${pct}%"></div></div>
            <span class="emotion-bar-count">${count}</span>
          </div>`;
        })
        .join('')
    : '<p class="empty-note">Todavía no hay registros en este periodo.</p>';

  document.getElementById('moodSummaryContent').innerHTML = `
    <div class="cal-nav">
      <button onclick="moodSummaryChangePeriod(-1)"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>
      <span class="cal-month">${range.label}</span>
      <button onclick="moodSummaryChangePeriod(1)"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg></button>
    </div>

    <div class="hero-card">
      <span class="hero-label">Media del periodo</span>
      <div class="hero-value">${nivelLabelTexto(mediaGlobal)}</div>
      <div class="hero-sub">${mediaGlobal !== null ? 'Intensidad media de ' + mediaGlobal.toFixed(1).replace('.', ',') + ' sobre 5' : 'Todavía no hay registros'}</div>
      <div class="hero-track"><div class="hero-fill" style="width:${mediaGlobal !== null ? (mediaGlobal / 5) * 100 : 0}%"></div></div>
    </div>

    <div class="stat-card">
      <div class="stat-head">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l3 8 4-16 3 8h4"/></svg>
        <span>Cómo ha evolucionado</span>
      </div>
      <p class="stat-desc">${variabilidadTexto}</p>
      <div class="chart-wrap">
        <div class="chart-y-labels"><span>Muy alto</span><span>Muy bajo</span></div>
        <svg class="chart-svg" viewBox="0 0 300 90" preserveAspectRatio="none">
          <line x1="0" y1="10" x2="300" y2="10" stroke="#E8E1D3" stroke-width="1"/>
          <line x1="0" y1="45" x2="300" y2="45" stroke="#E8E1D3" stroke-width="1" stroke-dasharray="2,3"/>
          <line x1="0" y1="80" x2="300" y2="80" stroke="#E8E1D3" stroke-width="1"/>
          ${polylines}
          ${circles}
        </svg>
        <div class="chart-x-labels">${xLabelsHtml}</div>
      </div>
      <div class="chart-legend">
        <div class="chart-legend-item"><div class="chart-legend-dot" style="background:var(--mood3)"></div>Días equilibrados</div>
        <div class="chart-legend-item"><div class="chart-legend-dot" style="background:var(--mood1)"></div>Días extremos (alto o bajo)</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-head">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a5 5 0 0 0-5 5c0 4 5 11 5 11s5-7 5-11a5 5 0 0 0-5-5Z"/><circle cx="12" cy="7" r="1"/></svg>
        <span>Emociones más frecuentes</span>
      </div>
      <div class="emotion-bars">${emotionBarsHtml}</div>
    </div>

    <div class="stat-card">
      <div class="stat-head">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
        <span>Cobertura de registros</span>
      </div>
      <div class="coverage-row">
        <span class="coverage-num">${totalRegistros}</span>
        <div class="coverage-track"><div class="coverage-fill" style="width:${coveragePct}%"></div></div>
        <span class="coverage-num">${totalFranjas} franjas</span>
      </div>
      <p class="stat-desc" style="margin-top:10px;">Has registrado el <b>${coveragePct}%</b> de las franjas posibles en este periodo.</p>
    </div>

    <p class="mood-disclaimer">
      Este resumen describe patrones de tus propios registros de autoseguimiento.<br>No es una valoración médica ni un diagnóstico.
    </p>
  `;
}
