const API_URL = 'https://diario-medico-worker.israel-reyes.workers.dev';
const SWIPE_OPEN_X = -80;
const TOKEN_KEY = 'diario_medico_token';
const USER_KEY = 'diario_medico_usuario';

let meds = [];
let editingId = null;
let currentDose = { morning: 0, noon: 0, night: 0 };
let authMode = 'login';
let autocompleteTimer = null;

// ---------- Autenticación ----------

function getToken() { return localStorage.getItem(TOKEN_KEY); }
function getUsuario() { return localStorage.getItem(USER_KEY); }

function guardarSesion(token, usuario) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, usuario);
}

function borrarSesion() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function toggleAuthMode() {
  authMode = authMode === 'login' ? 'register' : 'login';
  const esRegistro = authMode === 'register';

  document.getElementById('authSubtitle').textContent =
    esRegistro ? 'Crea una cuenta nueva' : 'Inicia sesión para ver tu pastillero';
  document.getElementById('authSubmitBtn').textContent = esRegistro ? 'Crear cuenta' : 'Entrar';
  document.getElementById('authSwitchBtn').textContent =
    esRegistro ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate';
  document.getElementById('fieldNombreCompleto').style.display = esRegistro ? 'block' : 'none';
  document.getElementById('fieldConfirmPassword').style.display = esRegistro ? 'block' : 'none';
  document.getElementById('authError').classList.remove('show');
}

function passwordEsSegura(password) {
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
}

async function submitAuth() {
  const usuario = document.getElementById('authUser').value.trim();
  const password = document.getElementById('authPassword').value;
  const errorEl = document.getElementById('authError');
  const btn = document.getElementById('authSubmitBtn');
  errorEl.classList.remove('show');

  if (!usuario || !password) {
    errorEl.textContent = 'Rellena usuario y contraseña.';
    errorEl.classList.add('show');
    return;
  }

  let nombreCompleto = '';
  if (authMode === 'register') {
    nombreCompleto = document.getElementById('authNombreCompleto').value.trim();
    const passwordConfirm = document.getElementById('authPasswordConfirm').value;

    if (!nombreCompleto) {
      errorEl.textContent = 'Indica tu nombre y apellidos.';
      errorEl.classList.add('show');
      return;
    }
    if (!passwordEsSegura(password)) {
      errorEl.textContent = 'La contraseña debe tener al menos 8 caracteres, con letras y números.';
      errorEl.classList.add('show');
      return;
    }
    if (password !== passwordConfirm) {
      errorEl.textContent = 'Las contraseñas no coinciden.';
      errorEl.classList.add('show');
      return;
    }
  }

  const endpoint = authMode === 'login' ? '/login' : '/register';
  btn.disabled = true;
  btn.textContent = authMode === 'login' ? 'Entrando...' : 'Creando...';

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password, nombreCompleto }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al acceder');

    guardarSesion(data.token, data.usuario);
    mostrarApp();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.add('show');
  } finally {
    btn.disabled = false;
    btn.textContent = authMode === 'login' ? 'Entrar' : 'Crear cuenta';
  }
}

async function logout() {
  const confirmado = confirm('¿Cerrar sesión?');
  if (!confirmado) return;
  try {
    await fetch(`${API_URL}/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  } catch (err) {}
  borrarSesion();
  mostrarAuth();
}

function mostrarAuth() {
  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('appScreen').style.display = 'none';
  document.getElementById('authUser').value = '';
  document.getElementById('authPassword').value = '';
}

function mostrarApp() {
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('appScreen').style.display = 'flex';
  document.getElementById('userLabel').textContent = getUsuario();
  loadMedicamentos();
}

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

// ---------- Autocompletado de medicamentos (CIMA) ----------

function initAutocomplete() {
  const input = document.getElementById('medName');
  const list = document.getElementById('autocompleteList');

  input.addEventListener('input', () => {
    clearTimeout(autocompleteTimer);
    const q = input.value.trim();
    if (q.length < 3) {
      list.classList.remove('show');
      list.innerHTML = '';
      return;
    }
    autocompleteTimer = setTimeout(() => buscarMedicamento(q), 350);
  });

  input.addEventListener('blur', () => {
    setTimeout(() => list.classList.remove('show'), 150);
  });
}

async function buscarMedicamento(q) {
  const list = document.getElementById('autocompleteList');
  try {
    const res = await fetch(`${API_URL}/medicamentos-buscar?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    const resultados = data.resultados || [];

    if (resultados.length === 0) {
      list.classList.remove('show');
      list.innerHTML = '';
      return;
    }

    list.innerHTML = resultados.map(r => `
      <div class="autocomplete-item" onclick="elegirMedicamento('${r.nombre.replace(/'/g, "\\'")}')">
        <div class="n">${r.nombre}</div>
        ${r.laboratorio ? `<div class="l">${r.laboratorio}</div>` : ''}
      </div>
    `).join('');
    list.classList.add('show');
  } catch (err) {
    list.classList.remove('show');
  }
}

function elegirMedicamento(nombre) {
  document.getElementById('medName').value = nombre;
  document.getElementById('autocompleteList').classList.remove('show');
}

// ---------- Información del medicamento ----------

async function verInfo(nombre) {
  document.getElementById('infoTitle').textContent = nombre;
  const contentEl = document.getElementById('infoContent');
  contentEl.innerHTML = 'Cargando...';
  document.getElementById('infoOverlay').classList.add('show');

  try {
    const res = await fetch(`${API_URL}/medicamento-info?nombre=${encodeURIComponent(nombre)}`);
    const data = await res.json();

    if (!res.ok) {
      contentEl.innerHTML = `<p class="info-error">${data.error || 'No se encontró información para este medicamento.'}</p>`;
      return;
    }

    if (!data.secciones || data.secciones.length === 0) {
      contentEl.innerHTML = '<p class="info-empty">No hay información detallada disponible para este medicamento.</p>';
      return;
    }

    contentEl.innerHTML = data.secciones.map(s => `
      <div class="info-section">
        <h4>${s.titulo}</h4>
        <p>${s.texto}</p>
      </div>
    `).join('');
  } catch (err) {
    contentEl.innerHTML = '<p class="info-error">No se pudo cargar la información. Comprueba tu conexión.</p>';
  }
}

// ---------- Dosis ----------

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

function stepDose(key, delta) {
  let v = currentDose[key] + delta;
  if (v < 0) v = 0;
  if (v > 4) v = 4;
  currentDose[key] = Math.round(v * 4) / 4;
  setStepperDisplay(key, currentDose[key]);
  document.getElementById('formError').classList.remove('show');
}

function setStepperDisplay(key, n) {
  const el = document.getElementById('val' + key.charAt(0).toUpperCase() + key.slice(1));
  const label = fmtDose(n);
  el.textContent = label ? label.replace(' comp', '') : '0';
}

function doseChip(cls, label, val) {
  const formatted = fmtDose(val);
  return `<div class="dose-chip ${cls} ${formatted ? 'active' : 'empty-dose'}">
    <div class="label"><span class="dot"></span>${label}</div>
    <div class="amount">${formatted || '—'}</div>
  </div>`;
}

// ---------- Render ----------

function render() {
  const list = document.getElementById('list');
  const hint = document.getElementById('swipeHint');
  list.innerHTML = '';
  document.getElementById('count').textContent = meds.length + (meds.length === 1 ? ' medicamento' : ' medicamentos');

  if (meds.length === 0) {
    hint.classList.add('hide');
    list.innerHTML = '<p style="color:var(--ink-soft); font-size:13.5px; text-align:center; padding:30px 0;">Todavía no has añadido ningún medicamento.</p>';
    return;
  }
  hint.classList.remove('hide');

  meds.forEach(m => {
    const wrap = document.createElement('div');
    wrap.className = 'med-card-wrap';
    wrap.innerHTML = `
      <button class="med-card-delete" onclick="deleteMed(${m.id})" aria-label="Eliminar">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
        </svg>
      </button>
      <div class="med-card" data-id="${m.id}">
        <div class="med-top">
          <div>
            <div class="med-name">${m.nombre}</div>
            ${m.nota ? `<div class="med-meta">${m.nota}</div>` : ''}
          </div>
          <div class="med-actions">
            <button class="edit-dot" onclick="verInfo('${m.nombre.replace(/'/g, "\\'")}')" aria-label="Información">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button class="edit-dot" onclick="editMed(${m.id})" aria-label="Editar">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </button>
          </div>
        </div>
        <div class="dose-row">
          ${doseChip('dawn-c', 'Desayuno', m.desayuno)}
          ${doseChip('noon-c', 'Comida', m.comida)}
          ${doseChip('dusk-c', 'Cena', m.cena)}
        </div>
      </div>
    `;
    list.appendChild(wrap);
    attachSwipe(wrap.querySelector('.med-card'));
  });
}

function attachSwipe(cardEl) {
  let startX = 0, currentX = 0, dragging = false, isOpen = false;

  cardEl.addEventListener('pointerdown', (e) => {
    startX = e.clientX;
    dragging = true;
    cardEl.style.transition = 'none';
  });

  cardEl.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const delta = e.clientX - startX;
    const base = isOpen ? SWIPE_OPEN_X : 0;
    let x = base + delta;
    if (x > 0) x = 0;
    if (x < SWIPE_OPEN_X) x = SWIPE_OPEN_X;
    currentX = x;
    cardEl.style.transform = `translateX(${x}px)`;
  });

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    cardEl.style.transition = 'transform 0.2s ease';
    if (currentX < SWIPE_OPEN_X / 2) {
      cardEl.style.transform = `translateX(${SWIPE_OPEN_X}px)`;
      isOpen = true;
    } else {
      cardEl.style.transform = 'translateX(0)';
      isOpen = false;
    }
  }

  cardEl.addEventListener('pointerup', endDrag);
  cardEl.addEventListener('pointercancel', endDrag);
}

// ---------- Carga y guardado ----------

async function loadMedicamentos() {
  try {
    const res = await apiFetch('/medicamentos');
    const data = await res.json();
    meds = data.medicamentos || [];
    render();
  } catch (err) {
    console.error(err);
  }
}

function openForm() {
  editingId = null;
  currentDose = { morning: 0, noon: 0, night: 0 };
  document.getElementById('formTitle').textContent = 'Añadir medicación';
  document.getElementById('medName').value = '';
  document.getElementById('medNote').value = '';
  document.getElementById('formError').classList.remove('show');
  document.getElementById('autocompleteList').classList.remove('show');
  ['morning', 'noon', 'night'].forEach(k => setStepperDisplay(k, 0));
  document.getElementById('formOverlay').classList.add('show');
}

function editMed(id) {
  const m = meds.find(x => x.id === id);
  editingId = id;
  currentDose = { morning: m.desayuno || 0, noon: m.comida || 0, night: m.cena || 0 };
  document.getElementById('formTitle').textContent = 'Editar medicación';
  document.getElementById('medName').value = m.nombre;
  document.getElementById('medNote').value = m.nota || '';
  document.getElementById('formError').classList.remove('show');
  document.getElementById('autocompleteList').classList.remove('show');
  ['morning', 'noon', 'night'].forEach(k => setStepperDisplay(k, currentDose[k]));
  document.getElementById('formOverlay').classList.add('show');
}

async function guardarLista(nuevaLista, botonQueMuestraCarga, textoCarga, textoNormal) {
  if (botonQueMuestraCarga) {
    botonQueMuestraCarga.disabled = true;
    botonQueMuestraCarga.textContent = textoCarga;
  }
  try {
    const res = await apiFetch('/medicamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medicamentos: nuevaLista }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Error al guardar');
    meds = result.medicamentos;
    render();
    return true;
  } catch (err) {
    alert('No se pudo guardar: ' + err.message);
    return false;
  } finally {
    if (botonQueMuestraCarga) {
      botonQueMuestraCarga.disabled = false;
      botonQueMuestraCarga.textContent = textoNormal;
    }
  }
}

async function saveMed() {
  const name = document.getElementById('medName').value.trim();
  if (!name) return;

  const totalDose = currentDose.morning + currentDose.noon + currentDose.night;
  if (totalDose === 0) {
    document.getElementById('formError').classList.add('show');
    return;
  }

  const data = {
    id: editingId || Date.now(),
    nombre: name,
    desayuno: currentDose.morning,
    comida: currentDose.noon,
    cena: currentDose.night,
    nota: document.getElementById('medNote').value.trim(),
  };

  let nuevaLista;
  if (editingId) {
    nuevaLista = meds.map(m => (m.id === editingId ? { ...m, ...data } : m));
  } else {
    nuevaLista = [...meds, data];
  }

  const saveBtn = document.getElementById('saveBtn');
  const ok = await guardarLista(nuevaLista, saveBtn, 'Guardando...', 'Guardar medicación');
  if (ok) document.getElementById('formOverlay').classList.remove('show');
}

async function deleteMed(id) {
  const med = meds.find(m => m.id === id);
  if (!med) return;

  const confirmado = confirm(`¿Seguro que quieres eliminar "${med.nombre}"? Se guardará en el histórico tal como estaba antes de borrarlo.`);
  if (!confirmado) {
    render();
    return;
  }

  const nuevaLista = meds.filter(m => m.id !== id);
  await guardarLista(nuevaLista, null, '', '');
}

async function toggleHistory(show) {
  const el = document.getElementById('historyOverlay');
  if (show) {
    const tl = document.getElementById('timeline');
    tl.innerHTML = 'Cargando...';
    try {
      const res = await apiFetch('/historico');
      const data = await res.json();
      const snapshots = data.historico || [];

      const ultimoIgualAAhora = snapshots.length > 0 && sonListasIguales(snapshots[0].medicamentos, meds);
      const ordered = ultimoIgualAAhora
        ? [{ creado_en: 'Ahora', medicamentos: meds, isCurrent: true }, ...snapshots.slice(1)]
        : [{ creado_en: 'Ahora', medicamentos: meds, isCurrent: true }, ...snapshots];

      if (ordered.length <= 1 && meds.length === 0) {
        tl.innerHTML = '<p style="color:var(--ink-soft); font-size:13.5px; text-align:center; padding:20px 0;">Todavía no hay histórico.</p>';
      } else {
        tl.innerHTML = ordered.map((snap, i) => {
          const prev = ordered[i + 1];
          const rows = snap.medicamentos.length
            ? snap.medicamentos.map(m => {
                const dose = [fmtDose(m.desayuno), fmtDose(m.comida), fmtDose(m.cena)].filter(Boolean).join(' · ') || 'sin dosis';
                const prevMatch = prev ? prev.medicamentos.find(p => p.nombre === m.nombre) : null;
                const changed = prev && (!prevMatch || prevMatch.desayuno !== m.desayuno || prevMatch.comida !== m.comida || prevMatch.cena !== m.cena);
                return `<div class="snap-med ${changed ? 'changed' : ''}"><span class="n">${m.nombre}</span><span class="d">${dose}</span></div>`;
              }).join('')
            : '<div class="snap-empty">Sin medicación registrada</div>';

          const fecha = snap.isCurrent ? 'Ahora' : 'Desde ' + formatFecha(snap.creado_en);

          return `
            <div class="snap-card ${snap.isCurrent ? 'current' : ''}">
              <div class="snap-head">
                <span class="snap-title">${fecha}</span>
                <span class="snap-badge ${snap.isCurrent ? '' : 'past'}">${snap.isCurrent ? 'Actual' : 'Anterior'}</span>
              </div>
              ${rows}
            </div>`;
        }).join('');
      }
    } catch (err) {
      tl.innerHTML = '<p style="color:#B23B3B; font-size:13px;">Error al cargar el histórico.</p>';
      console.error(err);
    }
  }
  el.classList.toggle('show', show);
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

function formatFecha(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

document.getElementById('formOverlay').addEventListener('click', e => { if (e.target.id === 'formOverlay') e.target.classList.remove('show'); });
document.getElementById('historyOverlay').addEventListener('click', e => { if (e.target.id === 'historyOverlay') e.target.classList.remove('show'); });
document.getElementById('infoOverlay').addEventListener('click', e => { if (e.target.id === 'infoOverlay') e.target.classList.remove('show'); });

// ---------- Arranque ----------

initAutocomplete();

if (getToken()) {
  mostrarApp();
} else {
  mostrarAuth();
}
