// Cambia entre las pantallas principales: inicio, ánimo, pastillero, ficha de emergencia

function goHome() {
  document.getElementById('moodScreen').style.display = 'none';
  document.getElementById('medsScreen').style.display = 'none';
  document.getElementById('emergencyScreen').style.display = 'none';
  document.getElementById('homeScreen').style.display = 'flex';
}

function goToMood() {
  document.getElementById('homeScreen').style.display = 'none';
  document.getElementById('medsScreen').style.display = 'none';
  document.getElementById('emergencyScreen').style.display = 'none';
  document.getElementById('moodScreen').style.display = 'flex';
  loadMoodToday();
}

function goToMeds() {
  document.getElementById('homeScreen').style.display = 'none';
  document.getElementById('moodScreen').style.display = 'none';
  document.getElementById('emergencyScreen').style.display = 'none';
  document.getElementById('medsScreen').style.display = 'flex';
  loadMedicamentos();
}

function goToEmergencia() {
  document.getElementById('homeScreen').style.display = 'none';
  document.getElementById('moodScreen').style.display = 'none';
  document.getElementById('medsScreen').style.display = 'none';
  document.getElementById('emergencyScreen').style.display = 'flex';
  loadEmergencia();
}
