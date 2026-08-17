// Página de inicio: tarjetas de navegación a cada sección.
// Para añadir una sección nueva a la app en el futuro, solo hay que añadir un objeto
// a esta lista — no hace falta tocar index.html.

const HOME_SECTIONS = [
  {
    className: 'meds',
    title: 'Pastillero',
    subtitle: 'Medicación, dosis e histórico',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>',
    onClick: 'goToMeds()',
  },
  {
    className: 'emergency',
    title: 'Ficha de emergencia',
    subtitle: 'Grupo sanguíneo, alergias y contactos',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    onClick: 'goToEmergencia()',
  },
];

function renderHomeCards() {
  const el = document.getElementById('homeCards');
  el.innerHTML = HOME_SECTIONS.map(s => `
    <div class="home-card" onclick="${s.onClick}">
      <div class="home-card-icon ${s.className}">${s.icon}</div>
      <div class="home-card-text">
        <h3>${s.title}</h3>
        <p>${s.subtitle}</p>
      </div>
      <div class="home-card-arrow">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
      </div>
    </div>
  `).join('');
}
