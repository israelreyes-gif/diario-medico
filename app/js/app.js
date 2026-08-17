// Arranque de la app: listeners de cierre de hojas y comprobación de sesión al abrir

document.getElementById('formOverlay').addEventListener('click', e => { if (e.target.id === 'formOverlay') closeForm(); });
document.getElementById('historyOverlay').addEventListener('click', e => { if (e.target.id === 'historyOverlay') toggleHistory(false); });
document.getElementById('infoOverlay').addEventListener('click', e => { if (e.target.id === 'infoOverlay') toggleInfo(false); });

initAutocomplete();

if (getToken()) {
  mostrarApp();
} else {
  mostrarAuth();
}
