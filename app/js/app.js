// Arranque de la app: monta cada pantalla, engancha los cierres de hojas y comprueba la sesión

initMoodScreen();
initMedsScreen();
initEmergencyScreen();
renderHomeCards();

document.getElementById('formOverlay').addEventListener('click', e => { if (e.target.id === 'formOverlay') closeForm(); });
document.getElementById('historyOverlay').addEventListener('click', e => { if (e.target.id === 'historyOverlay') toggleHistory(false); });
document.getElementById('infoOverlay').addEventListener('click', e => { if (e.target.id === 'infoOverlay') toggleInfo(false); });
document.getElementById('moodSummaryOverlay').addEventListener('click', e => { if (e.target.id === 'moodSummaryOverlay') toggleMoodSummary(false); });

initAutocomplete();

// Bloquea el pellizco para hacer zoom en toda la app. iOS a veces ignora el "user-scalable=no"
// del viewport por accesibilidad, así que hay que interceptar el gesto directamente.
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('gesturechange', e => e.preventDefault());
document.addEventListener('touchmove', e => {
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });

// También bloquea el "doble toque para hacer zoom"
let ultimoToque = 0;
document.addEventListener('touchend', e => {
  const ahora = Date.now();
  if (ahora - ultimoToque <= 300) e.preventDefault();
  ultimoToque = ahora;
}, { passive: false });

if (getToken()) {
  mostrarApp();
} else {
  mostrarAuth();
}
