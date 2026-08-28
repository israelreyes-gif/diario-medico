// Resúmenes semanal, mensual y anual: media, gráfico de evolución, emociones frecuentes, cobertura.
// Trabaja sobre una lista libre de registros (sin franjas fijas), agrupándolos por día donde haga falta.

let moodSummaryType = 'month'; // 'week' | 'month' | 'year'
let moodSummaryDate = new Date();

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
  document.getElementById('moodSummaryContent').innerHTML = 'Cargando...';

  try {
    const res = await apiFetch(`/animo-rango?inicio=${range.inicio}&fin=${range.fin}`);
    const data = await res.json();
    renderMoodSummary(range, data.registros || []);
  } catch (err) {
    document.getElementById('moodSummaryContent').innerHTML = '<p class="info-error">No se pudo cargar el resumen.</p>';
  }
}

// A partir de la lista libre de registros, calcula la media diaria (día por día del rango,
// promediando todos los registros que haya en cada uno; null si ese día no tiene ninguno)
function calcularPuntosDiarios(range, registros) {
  const porFecha = {};
  registros.forEach(r => {
    if (!porFecha[r.fecha]) porFecha[r.fecha] = [];
    porFecha[r.fecha].push(r.intensidad);
  });

  const puntos = [];
  const cur = new Date(range.inicio + 'T00:00:00');
  const finD = new Date(range.fin + 'T00:00:00');
  while (cur <= finD) {
    const fechaISO = toISO(cur);
    const niveles = porFecha[fechaISO];
    const avg = niveles && niveles.length ? niveles.reduce((a, b) => a + b, 0) / niveles.length : null;
    puntos.push({ fecha: fechaISO, avg });
    cur.setDate(cur.getDate() + 1);
  }
  return puntos;
}

function calcularTextoVariabilidad(valoresValidos, media) {
  if (valoresValidos.length < 2) return 'Todavía no hay suficientes registros para valorar la evolución.';
  const varianza = valoresValidos.reduce((acc, v) => acc + Math.pow(v - media, 2), 0) / valoresValidos.length;
  const desviacion = Math.sqrt(varianza);
  if (desviacion < 0.5) return 'Este periodo ha sido bastante estable, sin grandes cambios entre registros.';
  if (desviacion < 1.1) return 'Este periodo ha tenido algunos altibajos moderados.';
  return 'Este periodo ha tenido bastantes altibajos, con cambios marcados entre registros.';
}

function construirGraficoSVG(puntos) {
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

  return `<svg class="chart-svg" viewBox="0 0 300 90" preserveAspectRatio="none">
    <line x1="0" y1="10" x2="300" y2="10" stroke="#E8E1D3" stroke-width="1"/>
    <line x1="0" y1="45" x2="300" y2="45" stroke="#E8E1D3" stroke-width="1" stroke-dasharray="2,3"/>
    <line x1="0" y1="80" x2="300" y2="80" stroke="#E8E1D3" stroke-width="1"/>
    ${polylines}
    ${circles}
  </svg>`;
}

function construirEtiquetasEjeX(puntos) {
  if (moodSummaryType === 'week') {
    return puntos
      .map(p => `<span>${new Date(p.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short' }).charAt(0).toUpperCase()}</span>`)
      .join('');
  }
  if (moodSummaryType === 'year') {
    return ['E','F','M','A','M','J','J','A','S','O','N','D'].map(m => `<span>${m}</span>`).join('');
  }
  const n = puntos.length;
  const idxs = new Set([0, Math.floor((n - 1) / 3), Math.floor(((n - 1) * 2) / 3), n - 1]);
  return puntos
    .map((p, i) => (idxs.has(i) ? `<span>${new Date(p.fecha + 'T00:00:00').getDate()}</span>` : '<span></span>'))
    .join('');
}

// Cuenta cuántas veces aparece cada emoción entre TODOS los registros del rango (no por día)
function contarEmociones(registros) {
  const counts = {};
  registros.forEach(r => {
    counts[r.emocion] = (counts[r.emocion] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function construirBarrasEmociones(emocionesOrdenadas) {
  if (emocionesOrdenadas.length === 0) {
    return '<p class="empty-note">Todavía no hay registros en este periodo.</p>';
  }
  const maxCount = emocionesOrdenadas[0][1];
  return emocionesOrdenadas
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
    .join('');
}

function renderMoodSummary(range, registros) {
  const puntos = calcularPuntosDiarios(range, registros);
  const valoresValidos = puntos.filter(p => p.avg !== null).map(p => p.avg);
  const mediaGlobal = valoresValidos.length ? valoresValidos.reduce((a, b) => a + b, 0) / valoresValidos.length : null;

  const emocionesOrdenadas = contarEmociones(registros);
  const totalRegistros = registros.length;

  // Ya no hay "franjas fijas" que contar (5x3 por día); la cobertura ahora es días con al menos
  // un registro frente al total de días del periodo, que es la lectura equivalente más honesta.
  const diasConRegistro = puntos.filter(p => p.avg !== null).length;
  const coveragePct = range.totalDias ? Math.round((diasConRegistro / range.totalDias) * 100) : 0;

  const variabilidadTexto = calcularTextoVariabilidad(valoresValidos, mediaGlobal);
  const graficoSvg = construirGraficoSVG(puntos);
  const xLabelsHtml = construirEtiquetasEjeX(puntos);
  const emotionBarsHtml = construirBarrasEmociones(emocionesOrdenadas);

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
        ${graficoSvg}
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
        <span class="coverage-num">${diasConRegistro}</span>
        <div class="coverage-track"><div class="coverage-fill" style="width:${coveragePct}%"></div></div>
        <span class="coverage-num">${range.totalDias} días</span>
      </div>
      <p class="stat-desc" style="margin-top:10px;">Has registrado al menos una vez en el <b>${coveragePct}%</b> de los días de este periodo (${totalRegistros} registros en total).</p>
    </div>

    <p class="mood-disclaimer">
      Este resumen describe patrones de tus propios registros de autoseguimiento.<br>No es una valoración médica ni un diagnóstico.
    </p>
  `;
}
