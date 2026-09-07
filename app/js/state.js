// Estado global y utilidades compartidas por toda la app

const API_URL = 'https://api-proxy.israelreyes-gif.deno.net/diario-medico';

let meds = [];
let editingId = null;
let currentDose = { morning: 0, noon: 0, night: 0 };
let autocompleteTimer = null;
const SWIPE_OPEN_X = -80;

function getToken() {
  return localStorage.getItem('diario_medico_token');
}

function setToken(token) {
  localStorage.setItem('diario_medico_token', token);
}

function clearToken() {
  localStorage.removeItem('diario_medico_token');
  localStorage.removeItem('diario_medico_usuario');
  localStorage.removeItem('diario_medico_nombre_completo');
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    mostrarAuth();
  }

  return res;
}

function doseChip(colorClass, label, amount) {
  const isEmpty = !amount || amount === 0;
  const displayAmount = isEmpty ? '—' : formatDose(amount);
  return `
    <div class="dose-chip ${colorClass} ${isEmpty ? 'empty-dose' : 'active'}">
      <div class="label"><span class="dot"></span>${label}</div>
      <div class="amount">${displayAmount}</div>
    </div>
  `;
}

function formatDose(n) {
  if (n === 0.25) return '¼ comp';
  if (n === 0.5) return '½ comp';
  if (n === 0.75) return '¾ comp';
  if (Number.isInteger(n)) return `${n} comp`;
  return `${n} comp`;
}

function setStepperDisplay(key, value) {
  currentDose[key] = value;
  const labelMap = { morning: 'valMorning', noon: 'valNoon', night: 'valNight' };
  document.getElementById(labelMap[key]).textContent = formatDose(value).replace(' comp', '');
}

function stepDose(key, delta) {
  let newVal = currentDose[key] + delta;
  if (newVal < 0) newVal = 0;
  if (newVal > 4) newVal = 4;
  setStepperDisplay(key, newVal);
}
