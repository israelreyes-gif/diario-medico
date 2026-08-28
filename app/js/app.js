// Arranque de la app: monta cada pantalla, engancha los cierres de hojas y comprueba la sesión

initMoodScreen();
initMedsScreen();
initEmergencyScreen();
renderHomeCards();

document.getElementById('formOverlay').addEventListener('click', e => { if (e.target.id === 'formOverlay') closeForm(); });
document.getElementById('historyOverlay').addEventListener('click', e => { if (e.target.id === 'historyOverlay') toggleHistory(false); });
document.getElementById('infoOverlay').addEventListener('click', e => { if (e.target.id === 'infoOverlay') toggleInfo(false); });
document.getElementById('moodSummaryOverlay').addEventListener('click', e => { if (e.target.id === 'moodSummaryOverlay') toggleMoodSummary(false); });
document.getElementById('registroFormOverlay').addEventListener('click', e => { if (e.target.id === 'registroFormOverlay') cerrarRegistroForm(); });

initAutocomplete();

if (getToken()) {
  mostrarApp();
} else {
  mostrarAuth();
}
