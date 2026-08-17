// Configuración y estado compartido entre todos los módulos de la app

const API_URL = 'https://diario-medico-worker.israel-reyes.workers.dev';
const SWIPE_OPEN_X = -80;
const TOKEN_KEY = 'diario_medico_token';
const USER_KEY = 'diario_medico_usuario';
const NOMBRE_KEY = 'diario_medico_nombre_completo';

let meds = [];
let editingId = null;
let currentDose = { morning: 0, noon: 0, night: 0 };
let authMode = 'login';
let autocompleteTimer = null;

function getToken() { return localStorage.getItem(TOKEN_KEY); }
function getUsuario() { return localStorage.getItem(USER_KEY); }
function getNombreCompleto() { return localStorage.getItem(NOMBRE_KEY); }

function guardarSesion(token, usuario, nombreCompleto) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, usuario);
  localStorage.setItem(NOMBRE_KEY, nombreCompleto || usuario);
}

function borrarSesion() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(NOMBRE_KEY);
}

// Envuelve fetch añadiendo el token; si la sesión ya no es válida, vuelve a la pantalla de acceso
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${getToken()}`,
    },
  });
  if (res.status === 401) {
    borrarSesion();
    mostrarAuth();
    throw new Error('Sesión caducada, inicia sesión de nuevo.');
  }
  return res;
}

function fmtDose(n) {
  if (!n || n === 0) return null;
  const whole = Math.floor(n);
  const frac = Math.round((n - whole) * 100) / 100;
  const fracMap = { 0.25: '¼', 0.5: '½', 0.75: '¾' };
  let out = '';
  if (whole > 0) out += whole;
  if (fracMap[frac]) out += fracMap[frac];
  return out + ' comp';
}

function setStepperDisplay(key, n) {
  const el = document.getElementById('val' + key.charAt(0).toUpperCase() + key.slice(1));
  const label = fmtDose(n);
  el.textContent = label ? label.replace(' comp', '') : '0';
}

function stepDose(key, delta) {
  let v = currentDose[key] + delta;
  if (v < 0) v = 0;
  if (v > 4) v = 4;
  currentDose[key] = Math.round(v * 4) / 4;
  setStepperDisplay(key, currentDose[key]);
  document.getElementById('formError').classList.remove('show');
}

function doseChip(cls, label, val) {
  const formatted = fmtDose(val);
  return `<div class="dose-chip ${cls} ${formatted ? 'active' : 'empty-dose'}">
    <div class="label"><span class="dot"></span>${label}</div>
    <div class="amount">${formatted || '—'}</div>
  </div>`;
}

function formatFecha(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function sonListasIguales(listaA, listaB) {
  const normaliza = (lista) =>
    [...lista].map(m => ({
      nombre: m.nombre,
      desayuno: Number(m.desayuno) || 0,
      comida: Number(m.comida) || 0,
      cena: Number(m.cena) || 0,
    })).sort((a, b) => a.nombre.localeCompare(b.nombre));
  return JSON.stringify(normaliza(listaA)) === JSON.stringify(normaliza(listaB));
}
