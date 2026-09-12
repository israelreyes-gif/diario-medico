// Cambia entre las pantallas principales: inicio, bienestar, pastillero, ficha de emergencia, ayuda

function goHome() {
  document.getElementById('moodScreen').style.display = 'none';
  document.getElementById('medsScreen').style.display = 'none';
  document.getElementById('emergencyScreen').style.display = 'none';
  document.getElementById('helpScreen').style.display = 'none';
  document.getElementById('homeScreen').style.display = 'flex';
  updateHomePushTask();
}

function goToMood() {
  document.getElementById('homeScreen').style.display = 'none';
  document.getElementById('medsScreen').style.display = 'none';
  document.getElementById('emergencyScreen').style.display = 'none';
  document.getElementById('helpScreen').style.display = 'none';
  document.getElementById('moodScreen').style.display = 'flex';
  loadMoodToday();
}

function goToMeds() {
  document.getElementById('homeScreen').style.display = 'none';
  document.getElementById('moodScreen').style.display = 'none';
  document.getElementById('emergencyScreen').style.display = 'none';
  document.getElementById('helpScreen').style.display = 'none';
  document.getElementById('medsScreen').style.display = 'flex';
  loadMedicamentos();
}

function goToEmergencia() {
  document.getElementById('homeScreen').style.display = 'none';
  document.getElementById('moodScreen').style.display = 'none';
  document.getElementById('medsScreen').style.display = 'none';
  document.getElementById('helpScreen').style.display = 'none';
  document.getElementById('emergencyScreen').style.display = 'flex';
  loadEmergencia();
}

function goToHelp() {
  document.getElementById('homeScreen').style.display = 'none';
  document.getElementById('moodScreen').style.display = 'none';
  document.getElementById('medsScreen').style.display = 'none';
  document.getElementById('emergencyScreen').style.display = 'none';
  document.getElementById('helpScreen').style.display = 'flex';
  document.getElementById('helpList').scrollTop = 0;
  document.getElementById('helpBackTopBtn').classList.remove('show');
}
