const API_URL = 'https://diario-medico-worker.israel-reyes.workers.dev';
const SWIPE_OPEN_X = -80;

let meds = [];
let editingId = null;
let currentDose = { morning: 0, noon: 0, night: 0 };

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
          <button class="edit-dot" onclick="editMed(${m.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </button>
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

async function loadMedicamentos() {
  try {
    const res = await fetch(`${API_URL}/medicamentos`);
    const data = await res.json();
    meds = data.medicamentos || [];
    render();
  } catch (err) {
    document.getElementById('count').textContent = 'Error al cargar';
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
  ['morning', 'noon', 'night'].forEach(k => setStepperDisplay(k, currentDose[k]));
  document.getElementById('formOverlay').classList.add('show');
}

async function guardarLista(nuevaLista, botonQueMuestraCarga, textoCarga, textoNormal) {
  if (botonQueMuestraCarga) {
    botonQueMuestraCarga.disabled = true;
    botonQueMuestraCarga.textContent = textoCarga;
  }
  try {
    const res = await fetch(`${API_URL}/medicamentos`, {
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
    render(); // vuelve a pintar para que la tarjeta se cierre de nuevo
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
      const res = await fetch(`${API_URL}/historico`);
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

loadMedicamentos();
