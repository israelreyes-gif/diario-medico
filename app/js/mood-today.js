// Registro de hoy: lista de entradas libres (sin franjas), añadir/editar/borrar

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

  if (registrosHoy.length === 0) {
    container.innerHTML = '<p class="empty-note" style="padding:4px 2px 8px;">Todavía no has registrado nada hoy.</p>';
  } else {
    container.innerHTML = registrosHoy.map(r => {
      const meta = MOOD_EMOTIONS.find(e => e.id === r.emocion);
      return `
        <div class="slot-card">
          <div class="slot-head">
            <div class="slot-head-left">
              <span style="font-size:18px;">${meta?.emo || '❓'}</span>
              <span>${meta?.label || r.emocion} · Intensidad ${r.intensidad}</span>
            </div>
            <div class="slot-badge active">${r.hora}</div>
          </div>
          <div style="display:flex; gap:8px; margin-top:8px;">
            <button class="add-contact-btn" style="margin:0; flex:1; padding:8px;" onclick="abrirEdicionRegistro(${r.id})">Editar</button>
            <button class="remove-contact" style="padding:8px 12px; border:1.5px solid var(--line); border-radius:12px;" onclick="borrarRegistroAnimo(${r.id})">Eliminar</button>
          </div>
        </div>
      `;
    }).join('');
  }

  container.innerHTML += `<button class="add-contact-btn" onclick="abrirNuevoRegistro()">+ Añadir registro</button>`;
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

function abrirEdicionRegistro(id) {
  const r = registrosHoy.find(x => x.id === id);
  if (!r) return;
  registroEditandoId = id;
  nuevoRegistroDraft = { emotion: r.emocion, level: r.intensidad };
  document.getElementById('registroFormTitle').textContent = 'Editar registro';
  document.getElementById('registroFormHora').value = r.hora;
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
    if (registroEditandoId) {
      const res = await apiFetch(`/animo-registro/${registroEditandoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hora, emocion: nuevoRegistroDraft.emotion, intensidad: nuevoRegistroDraft.level }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
    } else {
      const res = await apiFetch('/animo-registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha: fechaHoyISO(), hora, emocion: nuevoRegistroDraft.emotion, intensidad: nuevoRegistroDraft.level }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
    }

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
  if (!confirmado) return;

  try {
    await apiFetch(`/animo-registro/${id}`, { method: 'DELETE' });
    await loadMoodToday();
  } catch (err) {
    alert('No se pudo eliminar: ' + err.message);
  }
}
