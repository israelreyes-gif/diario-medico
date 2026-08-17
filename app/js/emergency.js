// Ficha de emergencia: grupo sanguíneo, alergias, enfermedades y contactos

let emergencia = { grupoSanguineo: null, alergias: [], enfermedades: [], contactos: [] };

async function loadEmergencia() {
  try {
    const res = await apiFetch('/ficha-emergencia');
    const data = await res.json();
    emergencia = {
      grupoSanguineo: data.grupoSanguineo || null,
      alergias: data.alergias || [],
      enfermedades: data.enfermedades || [],
      contactos: data.contactos || [],
    };
    renderEmergencia();
  } catch (err) {
    console.error(err);
  }
}

function renderEmergencia() {
  renderBloodChips();
  renderAllergyList();
  renderDiseaseList();
  renderContacts();
}

function renderBloodChips() {
  document.querySelectorAll('.blood-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.grupo === emergencia.grupoSanguineo);
  });
}

function selectBloodGroup(g) {
  emergencia.grupoSanguineo = emergencia.grupoSanguineo === g ? null : g;
  renderBloodChips();
}

const CROSS_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>';
const PHONE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';

function renderAllergyList() {
  const el = document.getElementById('allergyList');
  if (emergencia.alergias.length === 0) {
    el.innerHTML = '<p class="empty-note">Ninguna añadida.</p>';
    return;
  }
  el.innerHTML = emergencia.alergias.map((a, i) =>
    `<div class="tag allergy">${a} <button onclick="removeAllergy(${i})">${CROSS_ICON}</button></div>`
  ).join('');
}

function renderDiseaseList() {
  const el = document.getElementById('diseaseList');
  if (emergencia.enfermedades.length === 0) {
    el.innerHTML = '<p class="empty-note">Ninguna añadida.</p>';
    return;
  }
  el.innerHTML = emergencia.enfermedades.map((e, i) =>
    `<div class="tag disease">${e} <button onclick="removeDisease(${i})">${CROSS_ICON}</button></div>`
  ).join('');
}

function addAllergyInput() {
  const input = document.getElementById('allergyInput');
  const val = input.value.trim();
  if (!val) return;
  emergencia.alergias.push(val);
  input.value = '';
  renderAllergyList();
}

function removeAllergy(i) {
  emergencia.alergias.splice(i, 1);
  renderAllergyList();
}

function addDiseaseInput() {
  const input = document.getElementById('diseaseInput');
  const val = input.value.trim();
  if (!val) return;
  emergencia.enfermedades.push(val);
  input.value = '';
  renderDiseaseList();
}

function removeDisease(i) {
  emergencia.enfermedades.splice(i, 1);
  renderDiseaseList();
}

function renderContacts() {
  const el = document.getElementById('contactsList');
  el.innerHTML = emergencia.contactos.map((c, i) => `
    <div class="contact-card">
      <div class="row">
        <div style="flex:1">
          <span class="mini-label">Nombre</span>
          <input type="text" value="${c.nombre || ''}" oninput="updateContacto(${i},'nombre',this.value)">
        </div>
      </div>
      <div class="row">
        <div style="flex:1">
          <span class="mini-label">Teléfono</span>
          <input type="tel" id="telInput${i}" value="${c.telefono || ''}" oninput="updateContacto(${i},'telefono',this.value)">
        </div>
        <button class="call-btn" onclick="llamarContacto(${i})" aria-label="Llamar">${PHONE_ICON}</button>
      </div>
      <button class="remove-contact" onclick="removeContacto(${i})">Eliminar contacto</button>
    </div>
  `).join('');

  document.getElementById('addContactBtn').style.display = emergencia.contactos.length < 2 ? 'block' : 'none';
}

function llamarContacto(i) {
  const numero = document.getElementById('telInput' + i).value.trim();
  if (!numero) {
    alert('Añade un número de teléfono antes de llamar.');
    return;
  }
  window.location.href = 'tel:' + numero.replace(/\s+/g, '');
}

function addContacto() {
  if (emergencia.contactos.length >= 2) return;
  emergencia.contactos.push({ nombre: '', telefono: '' });
  renderContacts();
}

function removeContacto(i) {
  emergencia.contactos.splice(i, 1);
  renderContacts();
}

function updateContacto(i, campo, valor) {
  emergencia.contactos[i][campo] = valor;
}

async function saveEmergencia() {
  const btn = document.getElementById('saveEmergenciaBtn');
  btn.disabled = true;
  btn.textContent = 'Guardando...';
  try {
    const res = await apiFetch('/ficha-emergencia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emergencia),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al guardar');
    emergencia = data;
    renderEmergencia();
    alert('Ficha de emergencia guardada.');
  } catch (err) {
    alert('No se pudo guardar: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Guardar ficha de emergencia';
  }
}
