// Constantes vitales — pestaña "Constantes" de Bienestar: lista del día, añadir, eliminar (deslizando)

const VITAL_TIPOS = [
  { id: 'tension', emo: '🩸', label: 'Tensión', unidad: 'mmHg' },
  { id: 'frecuencia_cardiaca', emo: '❤️', label: 'Frec. cardíaca', unidad: 'lpm' },
  { id: 'glucosa', emo: '🍯', label: 'Glucosa', unidad: 'mg/dL' },
  { id: 'peso', emo: '⚖️', label: 'Peso', unidad: 'kg' },
  { id: 'temperatura', emo: '🌡', label: 'Temperatura', unidad: '°C' },
];

let vitalsHoy = [];
let nuevoVitalTipo = null;

async function loadVitalsToday() {
  const fecha = fechaHoyISO();
  try {
    const res = await apiFetch(`/vitals-dia?fecha=${fecha}`);
    const data = await res.json();
    vitalsHoy = data.registros || [];
  } catch (err) {
    vitalsHoy = [];
  }
  renderVitalsHoy();
}

function formatVitalValor(tipo, valor) {
  const meta = VITAL_TIPOS.find(t => t.id === tipo);
  if (tipo === 'tension') return `${valor.sistolica}/${valor.diastolica} ${meta.unidad}`;
  return `${valor.valor} ${meta.unidad}`;
}

function renderVitalsHoy() {
  const container = document.getElementById('vitalsSlots');
  container.innerHTML = '';

  if (vitalsHoy.length === 0) {
    container.innerHTML = '<p class="empty-note" style="padding:4px 2px 8px;">Todavía no has registrado ninguna constante hoy.</p>';
  } else {
    vitalsHoy.forEach(r => {
      const meta = VITAL_TIPOS.find(t => t.id === r.tipo);
      const wrap = document.createElement('div');
      wrap.className = 'mood-entry-wrap';
      wrap.innerHTML = `
        <button class="mood-entry-delete" onclick="borrarVital(${r.id})" aria-label="Eliminar">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          </svg>
        </button>
        <div class="slot-card">
          <div class="slot-head">
            <div class="slot-head-left">
              <span style="font-size:18px;">${meta?.emo || '❓'}</span>
              <span>${meta?.label || r.tipo} · ${formatVitalValor(r.tipo, r.valor)}</span>
            </div>
            <div class="slot-badge active">${r.hora}</div>
          </div>
        </div>
      `;
      container.appendChild(wrap);
      attachSwipe(wrap.querySelector('.slot-card'));
    });
  }

  const addBtn = document.createElement('button');
  addBtn.className = 'add-contact-btn';
  addBtn.textContent = '+ Añadir constante';
  addBtn.onclick = abrirNuevaVital;
  container.appendChild(addBtn);
}

function abrirNuevaVital() {
  nuevoVitalTipo = null;
  document.getElementById('vitalFormHora').value = new Date().toTimeString().slice(0, 5);
  renderVitalFormTipos();
  renderVitalFormCampos();
  document.getElementById('vitalFormOverlay').classList.add('show');
}

function cerrarVitalForm() {
  document.getElementById('vitalFormOverlay').classList.remove('show');
}

function renderVitalFormTipos() {
  document.getElementById('vitalFormTipos').innerHTML = VITAL_TIPOS.map(t => `
    <div class="emotion-btn ${nuevoVitalTipo === t.id ? 'selected' : ''}" onclick="seleccionarVitalTipo('${t.id}')">
      <span class="emo">${t.emo}</span><span class="lbl">${t.label}</span>
    </div>`).join('');
}

function seleccionarVitalTipo(id) {
  nuevoVitalTipo = id;
  renderVitalFormTipos();
  renderVitalFormCampos();
}

function renderVitalFormCampos() {
  const cont = document.getElementById('vitalFormCampos');

  if (!nuevoVitalTipo) {
    cont.innerHTML = '';
    return;
  }

  const meta = VITAL_TIPOS.find(t => t.id === nuevoVitalTipo);

  if (nuevoVitalTipo === 'tension') {
    cont.innerHTML = `
      <div class="dose-grid" style="grid-template-columns:1fr 1fr;">
        <div class="field" style="margin-bottom:0;">
          <label>Sistólica (mmHg)</label>
          <input id="vitalSistolica" type="number" inputmode="numeric" placeholder="Ej. 120">
        </div>
        <div class="field" style="margin-bottom:0;">
          <label>Diastólica (mmHg)</label>
          <input id="vitalDiastolica" type="number" inputmode="numeric" placeholder="Ej. 80">
        </div>
      </div>
    `;
  } else {
    cont.innerHTML = `
      <div class="field">
        <label>${meta.label} (${meta.unidad})</label>
        <input id="vitalValorUnico" type="number" inputmode="decimal" step="0.1" placeholder="Ej. 72">
      </div>
    `;
  }
}

async function guardarVital() {
  const hora = document.getElementById('vitalFormHora').value;

  if (!nuevoVitalTipo) {
    alert('Elige qué constante quieres registrar.');
    return;
  }

  let valor;
  if (nuevoVitalTipo === 'tension') {
    const sistolica = parseInt(document.getElementById('vitalSistolica').value, 10);
    const diastolica = parseInt(document.getElementById('vitalDiastolica').value, 10);
    if (!sistolica || !diastolica) {
      alert('Rellena la sistólica y la diastólica.');
      return;
    }
    valor = { sistolica, diastolica };
  } else {
    const n = parseFloat(document.getElementById('vitalValorUnico').value);
    if (Number.isNaN(n)) {
      alert('Introduce un valor.');
      return;
    }
    valor = { valor: n };
  }

  const btn = document.getElementById('vitalFormSaveBtn');
  btn.disabled = true;
  btn.textContent = 'Guardando...';

  try {
    const res = await apiFetch('/vitals-registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fecha: fechaHoyISO(), hora, tipo: nuevoVitalTipo, valor }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al guardar');

    cerrarVitalForm();
    await loadVitalsToday();
    await loadMoodMonth(moodCalYear, moodCalMonth); // refresca la marca del calendario compartido
  } catch (err) {
    alert('No se pudo guardar: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Guardar constante';
  }
}

async function borrarVital(id) {
  const confirmado = confirm('¿Eliminar este registro?');
  if (!confirmado) {
    renderVitalsHoy();
    return;
  }

  try {
    await apiFetch(`/vitals-registro/${id}`, { method: 'DELETE' });
    await loadVitalsToday();
    await loadMoodMonth(moodCalYear, moodCalMonth);
  } catch (err) {
    alert('No se pudo eliminar: ' + err.message);
  }
}
