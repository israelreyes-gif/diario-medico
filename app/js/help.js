// Ayuda: hoja única con índice de secciones (Bienestar, Medicación, Emergencia,
// Exportar informe, Notificaciones) que hace scroll a cada sección al tocarla.

const HELP_SECTIONS = [
  { id: 'help-bienestar', color: 'var(--dusk-deep)', label: 'Bienestar' },
  { id: 'help-medicacion', color: '#B9832E', label: 'Medicación' },
  { id: 'help-emergencia', color: 'var(--danger)', label: 'Ficha de emergencia' },
  { id: 'help-informe', color: 'var(--teal-deep)', label: 'Exportar informe' },
  { id: 'help-notificaciones', color: 'var(--dusk)', label: 'Notificaciones' },
];

function openHelpSheet() {
  const el = document.getElementById('helpContent');
  el.innerHTML = `
    <div class="help-index">
      ${HELP_SECTIONS.map(s => `
        <div class="help-index-item" onclick="scrollToHelpSection('${s.id}')">
          <div class="help-index-dot" style="background:${s.color}"></div>
          <span>${s.label}</span>
          <div class="help-index-arrow"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg></div>
        </div>
      `).join('')}
    </div>

    ${renderHelpBienestar()}
    ${renderHelpMedicacion()}
    ${renderHelpEmergencia()}
    ${renderHelpInforme()}
    ${renderHelpNotificaciones()}
  `;
  document.getElementById('helpOverlay').classList.add('show');
}

function toggleHelp(show) {
  document.getElementById('helpOverlay').classList.toggle('show', show);
}

function scrollToHelpSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function helpSectionHead(icono, color, titulo) {
  return `
    <div class="help-section-head">
      <div class="help-section-icon" style="background:${color}">${icono}</div>
      <div class="help-section-title">${titulo}</div>
    </div>
  `;
}

function renderHelpBienestar() {
  return `
    <div class="help-section" id="help-bienestar">
      ${helpSectionHead('<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01"/><path d="M15 9h.01"/></svg>', 'var(--dusk-deep)', 'Bienestar')}
      <p class="help-text">Reúne tu <b>estado de ánimo</b> y tus <b>constantes vitales</b> en dos pestañas dentro de la misma sección, con un calendario compartido.</p>
      <p class="help-text">En "Hoy" puedes registrar cuantas veces quieras al día: elige una emoción, una intensidad del 1 al 5, y guarda. No hay franjas fijas — anota cuando te apetezca.</p>

      <div class="help-mock">
        <div class="help-mock-tabs">
          <div class="help-mock-tab active">Ánimo</div>
          <div class="help-mock-tab">Constantes</div>
        </div>
        <div class="help-mock-emo-row"><span class="emo">😌</span><span class="txt">Calma · Intensidad 3</span><span class="help-num">1</span></div>
        <div class="help-mock-add-btn">+ Añadir registro <span class="help-num">2</span></div>
        <div class="help-mock-cal-row">
          <div class="help-mock-cal-day">12<div class="d" style="background:var(--mood3)"></div></div>
          <div class="help-mock-cal-day">13<div class="d" style="background:var(--mood1)"></div></div>
          <div class="help-mock-cal-day">14<div class="d" style="background:var(--dusk)"></div></div>
          <div class="help-mock-cal-day">15<div class="d" style="background:var(--danger)"></div></div>
        </div>
        <div class="help-legend">
          <div class="help-legend-row"><span class="help-num">1</span>Desliza una tarjeta hacia la izquierda para eliminarla.</div>
          <div class="help-legend-row"><span class="help-num">2</span>Añade un nuevo registro con hora, emoción e intensidad libres.</div>
          <div class="help-legend-row"><span class="help-num">3</span>El calendario marca el día con un punto (intensidad), morado (comentario) o rojo (constantes). Tócalo para ver el detalle o añadir una nota.</div>
        </div>
      </div>

      <p class="help-text">Al final de la sección tienes tres <b>resúmenes</b> (semanal, mensual y anual) con la media del periodo, un gráfico de evolución y las emociones más frecuentes.</p>
    </div>
  `;
}

function renderHelpMedicacion() {
  return `
    <div class="help-section" id="help-medicacion">
      ${helpSectionHead('<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>', '#B9832E', 'Medicación')}
      <p class="help-text">Tu pastillero: cada medicamento muestra la dosis de <b>desayuno, comida y cena</b>. Al escribir el nombre, la app busca en la ficha técnica oficial (CIMA) y autocompleta.</p>

      <div class="help-mock">
        <div class="help-mock-med-card">
          <div class="help-mock-med-name">Enalapril 10mg <span class="help-num">1</span></div>
          <div class="help-mock-dose-row">
            <div class="help-mock-dose-chip">Desayuno<br>1 comp</div>
            <div class="help-mock-dose-chip">Comida<br>—</div>
            <div class="help-mock-dose-chip">Cena<br>½ comp</div>
          </div>
          <div class="help-mock-fab">+<span class="help-num" style="position:absolute; top:-6px; right:-6px;">2</span></div>
        </div>
        <div class="help-legend" style="margin-top:34px;">
          <div class="help-legend-row"><span class="help-num">1</span>Toca el icono del ojo en cada tarjeta para ver el prospecto oficial completo.</div>
          <div class="help-legend-row"><span class="help-num">2</span>Añade una medicación nueva con este botón.</div>
        </div>
      </div>

      <p class="help-text">Desliza una tarjeta hacia la izquierda para eliminarla — quedará guardada en el <b>histórico</b>, accesible con el icono de reloj arriba a la derecha.</p>
    </div>
  `;
}

function renderHelpEmergencia() {
  return `
    <div class="help-section" id="help-emergencia">
      ${helpSectionHead('<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>', 'var(--danger)', 'Ficha de emergencia')}
      <p class="help-text">Información clave para una urgencia: <b>grupo sanguíneo</b>, alergias, enfermedades, y contactos personales y médicos con botón de llamada directa.</p>

      <div class="help-mock">
        <div class="help-mock-blood-grid">
          <div class="help-mock-blood-chip">O+</div>
          <div class="help-mock-blood-chip sel">A− <span class="help-num" style="position:absolute; margin-top:-14px; margin-left:22px;">1</span></div>
          <div class="help-mock-blood-chip">B+</div>
          <div class="help-mock-blood-chip">AB+</div>
        </div>
        <div class="help-mock-contact">
          <span>Ana Marín (Psicóloga)</span>
          <span class="help-num">2</span>
        </div>
        <div class="help-legend">
          <div class="help-legend-row"><span class="help-num">1</span>Toca tu grupo sanguíneo para marcarlo; vuelve a tocarlo para quitarlo.</div>
          <div class="help-legend-row"><span class="help-num">2</span>Cada contacto tiene un botón de llamada directa junto al teléfono.</div>
        </div>
      </div>

      <p class="help-text">Recuerda pulsar <b>"Guardar ficha de emergencia"</b> al terminar de editarla — los cambios no se guardan solos.</p>
    </div>
  `;
}

function renderHelpInforme() {
  return `
    <div class="help-section" id="help-informe">
      ${helpSectionHead('<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M9 15h6"/><path d="M9 11h6"/></svg>', 'var(--teal-deep)', 'Exportar informe')}
      <p class="help-text">Genera un <b>PDF</b> para llevar al médico, eligiendo qué secciones incluir. Medicación y Ficha de emergencia se exportan tal como están ahora; Ánimo y Constantes según el rango de fechas que elijas.</p>

      <div class="help-mock">
        <div class="help-mock-check-row"><div class="help-mock-checkbox"><svg viewBox="0 0 24 24" fill="none" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg></div>Medicación actual</div>
        <div class="help-mock-check-row"><div class="help-mock-checkbox"><svg viewBox="0 0 24 24" fill="none" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg></div>Estado de ánimo <span class="help-num">1</span></div>
        <div class="help-mock-range">
          <div>Desde: 12/08</div>
          <div>Hasta: 12/09</div>
          <span class="help-num" style="margin-top:4px;">2</span>
        </div>
        <div class="help-mock-gen-btn">Generar y descargar PDF <span class="help-num">3</span></div>
        <div class="help-legend">
          <div class="help-legend-row"><span class="help-num">1</span>Marca solo las secciones que quieras incluir en el PDF.</div>
          <div class="help-legend-row"><span class="help-num">2</span>Si incluyes Ánimo o Constantes, aparece el rango de fechas — por defecto, el último mes.</div>
          <div class="help-legend-row"><span class="help-num">3</span>El PDF se descarga directamente a tu dispositivo.</div>
        </div>
      </div>
    </div>
  `;
}

function renderHelpNotificaciones() {
  return `
    <div class="help-section" id="help-notificaciones">
      ${helpSectionHead('<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>', 'var(--dusk)', 'Notificaciones')}
      <p class="help-text">Desde la pantalla de inicio puedes activar recordatorios para registrar tu ánimo tres veces al día (<b>mañana, tarde y noche</b>), hora de Madrid.</p>

      <div class="help-mock">
        <div class="help-mock-notif-card">
          <div class="help-mock-notif-icon"></div>
          <div class="help-mock-notif-text">
            <div class="t">Activar notificaciones</div>
            <div class="s">Recibe un recordatorio para registrar tu ánimo</div>
          </div>
          <div class="help-mock-notif-btn">Activar <span class="help-num">1</span></div>
        </div>
        <div class="help-legend">
          <div class="help-legend-row"><span class="help-num">1</span>Toca para activar o desactivar en cualquier momento — la tarjeta cambia de aspecto según el estado.</div>
        </div>
      </div>

      <p class="help-text">Solo funcionan si tienes la app <b>instalada en la pantalla de inicio</b> del móvil (no abierta desde Safari), con iOS 16.4 o superior.</p>
    </div>
  `;
}
