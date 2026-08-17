// Cambia entre las 3 pantallas principales: inicio, pastillero, ficha de emergencia

function goHome() {
  document.getElementById('medsScreen').style.display = 'none';
  document.getElementById('emergencyScreen').style.display = 'none';
  document.getElementById('homeScreen').style.display = 'flex';
}

function goToMeds() {
  document.getElementById('homeScreen').style.display = 'none';
  document.getElementById('emergencyScreen').style.display = 'none';
  document.getElementById('medsScreen').style.display = 'flex';
  loadMedicamentos();
}

function goToEmergencia() {
  document.getElementById('homeScreen').style.display = 'none';
  document.getElementById('medsScreen').style.display = 'none';
  document.getElementById('emergencyScreen').style.display = 'flex';
  loadEmergencia();
}
