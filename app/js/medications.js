// Pastillero: montaje de la pantalla, listado, autocompletado, añadir/editar/eliminar medicamentos

function initMedsScreen() {
  const el = document.getElementById('medsScreen');
  el.innerHTML = `
    <header>
      <div class="brand">
        <button class="back-btn" onclick="goHome()" aria-label="Volver al inicio">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div class="app-icon-sm meds">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
        </div>
        <h1>Pastillero</h1>
      </div>
      <div class="header-actions">
        <button class="history-btn" onclick="toggleHistory(true)" aria-label="Ver histórico">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>
          </svg>
        </button>
      </div>
    </header>

    <div class="section-title">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
      <span id="count">Cargando...</span>
    </div>

    <p class="swipe-hint" id="swipeHint">Desliza una tarjeta hacia la izquierda para eliminarla</p>

    <div class="list" id="list"></div>

    <button class="fab" onclick="openForm()" aria-label="Añadir medicación">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
    </button>
  `;
}

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

function closeForm() {
  document.getElementById('formOverlay').classList.remove('show');
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
  if (ok) closeForm();
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
