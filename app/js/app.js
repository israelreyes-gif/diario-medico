// Arranque de la app: monta cada pantalla, engancha los cierres de hojas y comprueba la sesión

initMoodScreen();
initMedsScreen();
initEmergencyScreen();
renderHomeCards();

document.getElementById('formOverlay').addEventListener('click', e => { if (e.target.id === 'formOverlay') closeForm(); });
document.getElementById('historyOverlay').addEventListener('click', e => { if (e.target.id === 'historyOverlay') toggleHistory(false); });
document.getElementById('infoOverlay').addEventListener('click', e => { if (e.target.id === 'infoOverlay') toggleInfo(false); });

initAutocomplete();

if (getToken()) {
  mostrarApp();
} else {
  mostrarAuth();
}
