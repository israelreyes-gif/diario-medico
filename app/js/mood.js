// Estado de ánimo: solo el montaje de la pantalla (el resto vive en mood-shared.js,
// mood-today.js, mood-calendar.js y mood-summary.js)

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
          <div class="mood-summary-icon"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4"/><path d="M16 3v4"/><path d="M4 10h16"/><circle cx="12" cy="15" r="2"/></svg></div>
          <h4>Resumen mensual</h4>
          <p>Evolución de este mes</p>
        </div>
      </div>

      <div class="mood-summary-card" style="margin-top:10px;" onclick="openMoodSummary('year')">
        <div class="mood-summary-icon"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="14" height="14" rx="2"/><path d="M7 5V3"/><path d="M13 5V3"/><path d="M7 11h6"/><rect x="7" y="3" width="14" height="14" rx="2" opacity="0.55"/></svg></div>
        <h4>Resumen anual</h4>
        <p>Evolución de todo el año</p>
      </div>

    </div>
  `;
}
