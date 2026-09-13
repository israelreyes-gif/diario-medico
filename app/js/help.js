// Ayuda: pantalla completa (no popup) con índice de secciones (Bienestar, Medicación, Emergencia,
// Exportar informe, Notificaciones) que hace scroll a cada sección al tocarla,
// y un botón flotante para volver arriba, al índice, sin tener que hacer scroll manual.

const HELP_SECTIONS = [
  { id: 'help-bienestar', color: 'var(--dusk-deep)', label: 'Bienestar' },
  { id: 'help-medicacion', color: '#B9832E', label: 'Medicación' },
  { id: 'help-emergencia', color: 'var(--danger)', label: 'Ficha de emergencia' },
  { id: 'help-informe', color: 'var(--teal-deep)', label: 'Exportar informe' },
  { id: 'help-notificaciones', color: 'var(--dusk)', label: 'Notificaciones' },
];

function initHelpScreen() {
  const el = document.getElementById('helpScreen');
  el.innerHTML = `
    <header>
      <div class="brand">
        <button class="back-btn" onclick="goHome()" aria-label="Volver al inicio">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div class="app-icon-sm help">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
        </div>
        <h1>Cómo funciona la app</h1>
      </div>
    </header>

    <div class="list" id="helpList" style="padding-bottom:40px; position:relative;">
      <div class="help-index" id="helpIndexTop">
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
    </div>

    <button class="help-back-top-btn" id="helpBackTopBtn" onclick="scrollToHelpTop()" aria-label="Volver al índice">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
    </button>
  `;

  document.getElementById('helpList').addEventListener('scroll', onHelpScroll);
}

function onHelpScroll(e) {
  const btn = document.getElementById('helpBackTopBtn');
  if (!btn) return;
  btn.classList.toggle('show', e.target.scrollTop > 200);
}

function scrollToHelpSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function scrollToHelpTop() {
  const list = document.getElementById('helpList');
  if (list) list.scrollTo({ top: 0, behavior: 'smooth' });
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
      <p class="help-text">Reúne tu <b>estado de ánimo</b> y tus <b>constantes vitales</b> en dos pestañas dentro de la misma sección, con un calendario compartido entre ambas.</p>

      <div class="help-subtitle">Registrar tu ánimo</div>
      <p class="help-text">En "Hoy" puedes registrar cuantas veces quieras al día: no hay franjas fijas de mañana/tarde/noche, anota cuando te apetezca — puedes incluso anotar varias veces seguidas si tu ánimo cambia.</p>

      <div class="help-mock">
        <div class="help-mock-tabs">
          <div class="help-mock-tab active">Ánimo</div>
          <div class="help-mock-tab">Constantes</div>
        </div>
        <div class="help-mock-emo-row"><span class="emo">😌</span><span class="txt">Calma · Intensidad 3</span><span class="help-num">1</span></div>
        <div class="help-mock-add-btn">+ Añadir registro <span class="help-num">2</span></div>
        <div class="help-legend">
          <div class="help-legend-row"><span class="help-num">1</span>Cada tarjeta muestra la hora, emoción e intensidad. Desliza hacia la izquierda para eliminarla.</div>
          <div class="help-legend-row"><span class="help-num">2</span>Toca aquí para añadir un registro nuevo, en cualquier momento del día.</div>
        </div>
      </div>

      <p class="help-text">Al tocar "+ Añadir registro" se abre un formulario donde eliges la hora, una de las 8 emociones disponibles, y una intensidad del 1 (muy bajo) al 5 (muy alto):</p>

      <div class="help-mock">
        <div class="help-mock-emo-grid">
          <div class="help-mock-emo-chip">😄</div>
          <div class="help-mock-emo-chip sel">😌 <span class="help-num" style="position:absolute; top:-6px; right:-6px;">1</span></div>
          <div class="help-mock-emo-chip">🤩</div>
          <div class="help-mock-emo-chip">🥱</div>
        </div>
        <div class="help-mock-int-bar">
          <div class="help-mock-int-seg"></div>
          <div class="help-mock-int-seg"></div>
          <div class="help-mock-int-seg sel">1</div>
          <div class="help-mock-int-seg"></div>
          <div class="help-mock-int-seg"></div>
        </div>
        <span class="help-num" style="position:relative; top:-30px; left:56%;">2</span>
        <div class="help-legend" style="margin-top:0;">
          <div class="help-legend-row"><span class="help-num">1</span>Elige la emoción que mejor describe cómo te sientes en ese momento.</div>
          <div class="help-legend-row"><span class="help-num">2</span>Marca la intensidad, de muy bajo a muy alto.</div>
        </div>
      </div>

      <div class="help-subtitle">Registrar constantes vitales</div>
      <p class="help-text">En la pestaña "Constantes" funciona igual: eliges el tipo (tensión, frecuencia cardíaca, glucosa, peso o temperatura) y rellenas su valor. La tensión pide sistólica y diastólica; el resto, un único número.</p>

      <div class="help-mock">
        <div class="help-mock-vital-grid">
          <div class="help-mock-vital-chip">🩸<br>Tensión <span class="help-num" style="position:absolute; top:-6px; right:-6px;">1</span></div>
          <div class="help-mock-vital-chip">❤️<br>Frec. card.</div>
          <div class="help-mock-vital-chip">🍯<br>Glucosa</div>
        </div>
        <div class="help-mock-vital-inputs">
          <div>Sistólica: 120</div>
          <div>Diastólica: 80</div>
        </div>
        <div class="help-legend">
          <div class="help-legend-row"><span class="help-num">1</span>Al elegir "Tensión" aparecen dos campos; el resto de tipos solo piden un valor y su unidad (lpm, mg/dL, kg, °C).</div>
        </div>
      </div>

      <div class="help-subtitle">Calendario compartido</div>
      <p class="help-text">Debajo de las pestañas hay un único calendario para todo el mes, con hasta tres marcas por día:</p>

      <div class="help-mock">
        <div class="help-mock-cal-row">
          <div class="help-mock-cal-day">12<div class="d" style="background:var(--mood3)"></div></div>
          <div class="help-mock-cal-day">13<div class="d" style="background:var(--mood1)"></div></div>
          <div class="help-mock-cal-day">14<div class="d" style="background:var(--dusk)"></div></div>
          <div class="help-mock-cal-day">15<div class="d" style="background:var(--danger)"></div></div>
        </div>
        <div class="help-legend">
          <div class="help-legend-row"><span class="help-num">1</span>El punto inferior indica la media de intensidad del ánimo ese día (verde=equilibrado, rojo=extremo, sea alto o bajo).</div>
          <div class="help-legend-row"><span class="help-num">2</span>Un punto morado en la esquina indica que ese día tiene un comentario escrito.</div>
          <div class="help-legend-row"><span class="help-num">3</span>Un punto rojo en la otra esquina indica que ese día hay alguna constante vital registrada.</div>
        </div>
      </div>

      <p class="help-text">Toca cualquier día pasado o de hoy para ver su detalle: las emociones y constantes registradas ese día, y un espacio para escribir o editar un <b>comentario libre</b> — los días futuros no se pueden tocar.</p>

      <div class="help-mock">
        <div class="help-mock-day-detail">
          <div class="help-mock-day-detail-row"><span>😌 Calma · Intensidad 3</span><span>09:15</span></div>
          <div class="help-mock-day-detail-row"><span>🩸 Tensión 120/80</span><span>21:40</span></div>
        </div>
        <div class="help-mock-textarea">Hoy ha sido un día tranquilo, sin sobresaltos... <span class="help-num" style="position:absolute; top:-8px; right:-8px;">1</span></div>
        <div class="help-legend">
          <div class="help-legend-row"><span class="help-num">1</span>Escribe lo que quieras sobre ese día y pulsa "Guardar comentario" — se puede editar cuantas veces quieras.</div>
        </div>
      </div>

      <div class="help-subtitle">Resúmenes semanal, mensual y anual</div>
      <p class="help-text">Al final de la sección tienes tres informes con la media del periodo, un gráfico de evolución día a día, y las emociones más frecuentes.</p>

      <div class="help-mock">
        <div class="help-mock-summary-hero">
          <div class="l">Media del periodo</div>
          <div class="v">Neutro</div>
        </div>
        <div class="help-legend">
          <div class="help-legend-row"><span class="help-num">1</span>Usa las flechas del propio resumen para navegar entre semanas, meses o años anteriores.</div>
        </div>
      </div>
    </div>
  `;
}

function renderHelpMedicacion() {
  return `
    <div class="help-section" id="help-medicacion">
      ${helpSectionHead('<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>', '#B9832E', 'Medicación')}
      <p class="help-text">Tu pastillero completo: cada medicamento muestra la dosis de <b>desayuno, comida y cena</b>, en comprimidos o fracciones (¼, ½, ¾).</p>

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
          <div class="help-legend-row"><span class="help-num">1</span>Toca el icono del ojo en cada tarjeta para ver el prospecto oficial completo de ese medicamento.</div>
          <div class="help-legend-row"><span class="help-num">2</span>Añade una medicación nueva con este botón.</div>
        </div>
      </div>

      <div class="help-subtitle">Buscar y añadir un medicamento</div>
      <p class="help-text">Al escribir el nombre (3 letras o más), la app consulta la ficha técnica oficial (CIMA, de la AEMPS) y sugiere coincidencias con su laboratorio:</p>

      <div class="help-mock">
        <div class="help-mock-autocomplete-input">Enala<span class="help-num" style="position:absolute; top:-6px; right:-6px;">1</span></div>
        <div class="help-mock-autocomplete-item">ENALAPRIL 10mg comprimidos<div class="l">Laboratorio Normon</div></div>
        <div class="help-mock-autocomplete-item">ENALAPRIL 20mg comprimidos<div class="l">Laboratorio Cinfa</div></div>
        <div class="help-legend">
          <div class="help-legend-row"><span class="help-num">1</span>Toca cualquier resultado para rellenar el nombre exacto y quedarte con la ficha correcta.</div>
        </div>
      </div>

      <p class="help-text">Debajo del nombre, ajusta la dosis de cada franja con los botones +/− (avanzan de ¼ en ¼ comprimido):</p>

      <div class="help-mock">
        <div class="help-mock-stepper">
          <div class="help-mock-stepper-btn">−</div>
          <span>½ <span class="help-num" style="position:relative; top:-10px;">1</span></span>
          <div class="help-mock-stepper-btn">+</div>
        </div>
        <div class="help-legend">
          <div class="help-legend-row"><span class="help-num">1</span>Cada franja (desayuno, comida, cena) tiene su propio contador independiente.</div>
        </div>
      </div>

      <div class="help-subtitle">Eliminar e histórico de cambios</div>
      <p class="help-text">Desliza una tarjeta hacia la izquierda para eliminarla. No se pierde: queda guardada en el <b>histórico</b>, accesible con el icono de reloj arriba a la derecha de la pantalla.</p>

      <div class="help-mock">
        <div class="help-mock-history-item">
          <div class="fecha">28 de agosto</div>
          <span class="help-mock-highlight">Enalapril 10mg</span> — dosis de cena cambiada a ½ comp
        </div>
        <div class="help-legend">
          <div class="help-legend-row"><span class="help-num">1</span>Cada entrada del histórico es una "foto" completa de tu pastillero en ese momento, resaltando en color lo que cambió respecto a la anterior.</div>
        </div>
      </div>
    </div>
  `;
}

function renderHelpEmergencia() {
  return `
    <div class="help-section" id="help-emergencia">
      ${helpSectionHead('<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>', 'var(--danger)', 'Ficha de emergencia')}
      <p class="help-text">Información clave para una urgencia médica, siempre a mano en tu móvil.</p>

      <div class="help-subtitle">Grupo sanguíneo</div>
      <div class="help-mock">
        <div class="help-mock-blood-grid">
          <div class="help-mock-blood-chip">O+</div>
          <div class="help-mock-blood-chip sel">A− <span class="help-num" style="position:absolute; margin-top:-14px; margin-left:22px;">1</span></div>
          <div class="help-mock-blood-chip">B+</div>
          <div class="help-mock-blood-chip">AB+</div>
        </div>
        <div class="help-legend">
          <div class="help-legend-row"><span class="help-num">1</span>Toca tu grupo sanguíneo para marcarlo; vuelve a tocarlo para quitarlo. Solo puede haber uno seleccionado.</div>
        </div>
      </div>

      <div class="help-subtitle">Alergias y enfermedades</div>
      <p class="help-text">Añade cada alergia o enfermedad como una etiqueta independiente, escribiendo el texto y tocando el botón "+":</p>

      <div class="help-mock">
        <div class="help-mock-tag-row">
          <span class="help-mock-tag">Penicilina ✕</span>
          <span class="help-mock-tag">Frutos secos ✕ <span class="help-num" style="position:relative; top:-6px;">1</span></span>
        </div>
        <div class="help-legend">
          <div class="help-legend-row"><span class="help-num">1</span>Toca la "✕" de cualquier etiqueta para eliminarla.</div>
        </div>
      </div>

      <div class="help-subtitle">Contactos personales y médicos</div>
      <p class="help-text">Añade tantos contactos como necesites en cada grupo. Cada contacto médico incluye además su especialidad. (Los nombres y teléfonos de este ejemplo son inventados, solo para mostrar el diseño):</p>

      <div class="help-mock">
        <div class="help-mock-contact">
          <span>María Ejemplo — 600 000 000</span>
          <span class="help-num">1</span>
        </div>
        <div class="help-mock-contact">
          <span>Dr. Pérez (Cardiólogo)</span>
          <span class="help-num">2</span>
        </div>
        <div class="help-legend">
          <div class="help-legend-row"><span class="help-num">1</span>Cada contacto personal tiene un botón de llamada directa junto al teléfono.</div>
          <div class="help-legend-row"><span class="help-num">2</span>Los contactos médicos añaden también la especialidad, para identificarlos rápido en una urgencia.</div>
        </div>
      </div>

      <div class="help-mock">
        <div class="help-mock-save-btn">Guardar ficha de emergencia <span class="help-num" style="position:absolute; top:-6px; right:-6px;">1</span></div>
        <div class="help-legend">
          <div class="help-legend-row"><span class="help-num">1</span>Importante: pulsa siempre este botón al terminar — los cambios no se guardan automáticamente.</div>
        </div>
      </div>
    </div>
  `;
}

function renderHelpInforme() {
  return `
    <div class="help-section" id="help-informe">
      ${helpSectionHead('<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M9 15h6"/><path d="M9 11h6"/></svg>', 'var(--teal-deep)', 'Exportar informe')}
      <p class="help-text">Genera un <b>PDF</b> para llevar al médico, eligiendo exactamente qué secciones incluir cada vez.</p>

      <div class="help-mock">
        <div class="help-mock-check-row"><div class="help-mock-checkbox"><svg viewBox="0 0 24 24" fill="none" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg></div>Medicación actual <span class="help-num">1</span></div>
        <div class="help-mock-check-row"><div class="help-mock-checkbox off"></div>Ficha de emergencia</div>
        <div class="help-mock-check-row"><div class="help-mock-checkbox"><svg viewBox="0 0 24 24" fill="none" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg></div>Estado de ánimo <span class="help-num">2</span></div>
        <div class="help-mock-range">
          <div>Desde: 12/08</div>
          <div>Hasta: 12/09</div>
          <span class="help-num" style="margin-top:4px;">3</span>
        </div>
        <div class="help-legend">
          <div class="help-legend-row"><span class="help-num">1</span>Medicación y Ficha de emergencia se exportan siempre "tal como están ahora" — no tienen rango de fechas.</div>
          <div class="help-legend-row"><span class="help-num">2</span>Ánimo y Constantes vitales exportan los registros dentro del rango elegido.</div>
          <div class="help-legend-row"><span class="help-num">3</span>Si marcas Ánimo o Constantes, aparece el selector de fechas — por defecto, el último mes.</div>
        </div>
      </div>

      <div class="help-subtitle">El documento generado</div>
      <p class="help-text">El PDF está organizado por secciones, con la medicación agrupada por medicamento, las constantes agrupadas por tipo (todas las tensiones juntas, todos los pesos juntos...) y el ánimo agrupado día por día, con tu comentario si lo escribiste:</p>

      <div class="help-mock">
        <div class="help-mock-pdf-page">
          <div class="help-mock-pdf-band" style="background:var(--teal-deep); width:100%;"></div>
          <div class="help-mock-pdf-line short" style="background:#B9832E; height:9px; margin-bottom:6px;"></div>
          <div class="help-mock-pdf-line"></div>
          <div class="help-mock-pdf-line short"></div>
          <div class="help-mock-pdf-line" style="background:var(--danger); width:40%; height:9px; margin:8px 0 6px;"></div>
          <div class="help-mock-pdf-line"></div>
        </div>
        <div class="help-legend">
          <div class="help-legend-row"><span class="help-num">1</span>Cada sección lleva una barra de color a modo de identificación rápida, igual que en la app.</div>
        </div>
      </div>

      <div class="help-mock">
        <div class="help-mock-gen-btn">Generar y descargar PDF <span class="help-num">1</span></div>
        <div class="help-legend">
          <div class="help-legend-row"><span class="help-num">1</span>El PDF se descarga directamente a tu dispositivo, listo para compartir o imprimir.</div>
        </div>
      </div>
    </div>
  `;
}

function renderHelpNotificaciones() {
  return `
    <div class="help-section" id="help-notificaciones">
      ${helpSectionHead('<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>', 'var(--dusk)', 'Notificaciones')}
      <p class="help-text">Desde la pantalla de inicio puedes activar recordatorios para registrar tu ánimo tres veces al día (<b>mañana, tarde y noche</b>), calculados siempre en hora de Madrid.</p>

      <div class="help-subtitle">Activarlas</div>
      <div class="help-mock">
        <div class="help-mock-notif-card">
          <div class="help-mock-notif-icon off"></div>
          <div class="help-mock-notif-text">
            <div class="t">Activar notificaciones</div>
            <div class="s">Recibe un recordatorio para registrar tu ánimo</div>
          </div>
          <div class="help-mock-notif-btn">Activar <span class="help-num">1</span></div>
        </div>
        <div class="help-legend">
          <div class="help-legend-row"><span class="help-num">1</span>Al tocar "Activar", el sistema del móvil te pedirá confirmación una sola vez.</div>
        </div>
      </div>

      <div class="help-mock">
        <div class="help-mock-system-dialog">
          <div class="t">"Diario médico" quiere enviarte notificaciones</div>
          <div class="s">Las notificaciones pueden incluir alertas, sonidos e iconos</div>
          <div class="help-mock-system-dialog-btns">
            <div>No permitir</div>
            <div style="font-weight:700;">Permitir <span class="help-num" style="position:relative; top:-10px;">1</span></div>
          </div>
        </div>
        <div class="help-legend">
          <div class="help-legend-row"><span class="help-num">1</span>Elige "Permitir" para que los recordatorios lleguen aunque tengas la app cerrada.</div>
        </div>
      </div>

      <div class="help-subtitle">Ya activadas</div>
      <p class="help-text">Una vez activas, la tarjeta cambia de aspecto y puedes desactivarlas en cualquier momento desde el mismo sitio:</p>

      <div class="help-mock">
        <div class="help-mock-notif-card">
          <div class="help-mock-notif-icon"></div>
          <div class="help-mock-notif-text">
            <div class="t">Notificaciones activadas</div>
            <div class="s">Te avisamos al empezar mañana, tarde y noche</div>
          </div>
          <div class="help-mock-notif-btn off">Desactivar <span class="help-num">1</span></div>
        </div>
        <div class="help-legend">
          <div class="help-legend-row"><span class="help-num">1</span>Toca "Desactivar" siempre que quieras dejar de recibirlas.</div>
        </div>
      </div>

      <p class="help-text">Un requisito importante: solo funcionan si tienes la app <b>instalada en la pantalla de inicio</b> del móvil (no abierta desde Safari), con iOS 16.4 o superior. Si no cumples estos requisitos, la tarjeta te lo indicará en lugar del botón de activar.</p>
    </div>
  `;
}
