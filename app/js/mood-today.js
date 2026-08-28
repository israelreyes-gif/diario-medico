// Registro de hoy: lista de entradas libres (sin franjas), añadir y eliminar (deslizando a la izquierda)

let registrosHoy = [];
let registroEditandoId = null;
let nuevoRegistroDraft = { emotion: null, level: null };

async function loadMoodToday() {
  const fecha = fechaHoyISO();
  document.getElementById('moodTodayLabel').textContent =
    new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  try {
    const res = await apiFetch(`/animo-dia?fecha=${fecha}`);
    const data = await res.json();
    registrosHoy = data.registros || [];
  } catch (err) {
    registrosHoy = [];
  }

  renderRegistrosHoy();
  await loadMoodMonth(moodCalYear, moodCalMonth);
}

function renderRegistrosHoy() {
  const container = document.getElementById('moodSlots');
  container.innerHTML = '';

  if (registrosHoy.length === 0) {
    container.innerHTML = '<p class="empty-note" style="padding:4px 2px 8px;">Todavía no has registrado nada hoy.</p>';
  } else {
    registrosHoy.forEach(r => {
      const meta = MOOD_EMOTIONS.find(e => e.id === r.emocion);
      const wrap = document.createElement('div');
      wrap.className = 'mood-entry-wrap';
      wrap.innerHTML = `
        <button class="mood-entry-delete" onclick="borrarRegistroAnimo(${r.id})" aria-label="Eliminar">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          </svg>
        </button>
        <div class="slot-card">
          <div class="slot-head">
            <div class="slot-head-left">
              <span style="font-size:18px;">${meta?.emo || '❓'}</span>
              <span>${meta?.label || r.emocion} · Intensidad ${r.intensidad}</span>
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
  addBtn.textContent = '+ Añadir registro';
  addBtn.onclick = abrirNuevoRegistro;
  container.appendChild(addBtn);
}

function abrirNuevoRegistro() {
  registroEditandoId = null;
  nuevoRegistroDraft = { emotion: null, level: null };
  document.getElementById('registroFormTitle').textContent = 'Nuevo registro';
  document.getElementById('registroFormHora').value = new Date().toTimeString().slice(0, 5);
  renderRegistroFormEmociones();
  renderRegistroFormIntensidad();
  document.getElementById('registroFormOverlay').classList.add('show');
}

function cerrarRegistroForm() {
  document.getElementById('registroFormOverlay').classList.remove('show');
}

function renderRegistroFormEmociones() {
  document.getElementById('registroFormEmociones').innerHTML = MOOD_EMOTIONS.map(e => `
    <div class="emotion-btn ${nuevoRegistroDraft.emotion === e.id ? 'selected' : ''}" onclick="seleccionarEmocionRegistro('${e.id}')">
      <span class="emo">${e.emo}</span><span class="lbl">${e.label}</span>
    </div>`).join('');
}

function renderRegistroFormIntensidad() {
  document.getElementById('registroFormIntensidad').innerHTML = [1,2,3,4,5].map(n =>
    `<div class="intensity-seg i${n} ${nuevoRegistroDraft.level === n ? 'selected' : ''}" onclick="seleccionarIntensidadRegistro(${n})"></div>`
  ).join('');
}

function seleccionarEmocionRegistro(id) {
  nuevoRegistroDraft.emotion = id;
  renderRegistroFormEmociones();
}

function seleccionarIntensidadRegistro(n) {
  nuevoRegistroDraft.level = n;
  renderRegistroFormIntensidad();
}

async function guardarRegistroAnimo() {
  const hora = document.getElementById('registroFormHora').value;
  if (!nuevoRegistroDraft.emotion || !nuevoRegistroDraft.level) {
    alert('Elige una emoción y una intensidad.');
    return;
  }

  const btn = document.getElementById('registroFormSaveBtn');
  btn.disabled = true;
  btn.textContent = 'Guardando...';

  try {
    const res = await apiFetch('/animo-registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fecha: fechaHoyISO(), hora, emocion: nuevoRegistroDraft.emotion, intensidad: nuevoRegistroDraft.level }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al guardar');

    cerrarRegistroForm();
    await loadMoodToday();
  } catch (err) {
    alert('No se pudo guardar: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Guardar registro';
  }
}

async function borrarRegistroAnimo(id) {
  const confirmado = confirm('¿Eliminar este registro?');
  if (!confirmado) {
    renderRegistrosHoy();
    return;
  }

  try {
    await apiFetch(`/animo-registro/${id}`, { method: 'DELETE' });
    await loadMoodToday();
  } catch (err) {
    alert('No se pudo eliminar: ' + err.message);
  }
}
