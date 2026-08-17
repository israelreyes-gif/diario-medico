// Ficha de emergencia: montaje de la pantalla, grupo sanguíneo, alergias, enfermedades y contactos

function initEmergencyScreen() {
  const el = document.getElementById('emergencyScreen');
  el.innerHTML = `
    <header>
      <div class="brand">
        <button class="back-btn" onclick="goHome()" aria-label="Volver al inicio">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div class="app-icon-sm emergency">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        </div>
        <h1>Ficha de emergencia</h1>
      </div>
    </header>

    <div class="list" style="padding-bottom:40px;">

      <div class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a5 5 0 0 0-5 5c0 4 5 11 5 11s5-7 5-11a5 5 0 0 0-5-5Z"/></svg>
        Grupo sanguíneo
      </div>
      <div class="blood-grid">
        <div class="blood-chip" data-grupo="O+" onclick="selectBloodGroup('O+')">O+</div>
        <div class="blood-chip" data-grupo="O-" onclick="selectBloodGroup('O-')">O−</div>
        <div class="blood-chip" data-grupo="A+" onclick="selectBloodGroup('A+')">A+</div>
        <div class="blood-chip" data-grupo="A-" onclick="selectBloodGroup('A-')">A−</div>
        <div class="blood-chip" data-grupo="B+" onclick="selectBloodGroup('B+')">B+</div>
        <div class="blood-chip" data-grupo="B-" onclick="selectBloodGroup('B-')">B−</div>
        <div class="blood-chip" data-grupo="AB+" onclick="selectBloodGroup('AB+')">AB+</div>
        <div class="blood-chip" data-grupo="AB-" onclick="selectBloodGroup('AB-')">AB−</div>
      </div>

      <div class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5-.35.35a2.5 2.5 0 0 1-3.54 0l-.46-.46a2.5 2.5 0 0 1 0-3.54L9 13"/><path d="M3.5 13.5 13.5 3.5a3 3 0 1 1 4 4l-1 1"/><path d="m14 15 4-4"/><path d="M17.5 17.5 22 22"/></svg>
        Alergias
      </div>
      <div class="tag-input-row">
        <input type="text" id="allergyInput" placeholder="Ej. Penicilina, frutos secos..." onkeydown="if(event.key==='Enter')addAllergyInput()">
        <button class="tag-add-btn" onclick="addAllergyInput()">+</button>
      </div>
      <div class="tag-list" id="allergyList"></div>

      <div class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        Enfermedades
      </div>
      <div class="tag-input-row">
        <input type="text" id="diseaseInput" placeholder="Ej. Epilepsia, hipertensión..." onkeydown="if(event.key==='Enter')addDiseaseInput()">
        <button class="tag-add-btn" onclick="addDiseaseInput()">+</button>
      </div>
      <div class="tag-list" id="diseaseList"></div>

      <div class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        Contactos personales
      </div>
      <div id="personalContactsList"></div>
      <button class="add-contact-btn" onclick="addContactoPersonal()">+ Añadir contacto</button>

      <div class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/></svg>
        Contactos médicos
      </div>
      <div id="medicalContactsList"></div>
      <button class="add-contact-btn" onclick="addContactoMedico()">+ Añadir contacto médico</button>

      <button class="save-btn" id="saveEmergenciaBtn" onclick="saveEmergencia()">Guardar ficha de emergencia</button>
    </div>
  `;
}

let emergencia = { grupoSanguineo: null, alergias: [], enfermedades: [], contactosPersonales: [], contactosMedicos: [] };

async function loadEmergencia() {
  try {
    const res = await apiFetch('/ficha-emergencia');
    const data = await res.json();
    emergencia = {
      grupoSanguineo: data.grupoSanguineo || null,
      alergias: data.alergias || [],
      enfermedades: data.enfermedades || [],
      contactosPersonales: data.contactosPersonales || [],
      contactosMedicos: data.contactosMedicos || [],
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
  renderContactList('contactosPersonales', 'personalContactsList');
  renderContactList('contactosMedicos', 'medicalContactsList', true);
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

function renderContactList(campo, elementId, esMedico = false) {
  const el = document.getElementById(elementId);
  const lista = emergencia[campo];

  if (lista.length === 0) {
    el.innerHTML = '<p class="empty-note">Ninguno añadido.</p>';
    return;
  }

  el.innerHTML = lista.map((c, i) => `
    <div class="contact-card">
      <div class="row">
        <div style="flex:1">
          <span class="mini-label">Nombre</span>
          <input type="text" value="${c.nombre || ''}" oninput="updateContacto('${campo}',${i},'nombre',this.value)">
        </div>
      </div>
      ${esMedico ? `
      <div class="row">
        <div style="flex:1">
          <span class="mini-label">Especialidad</span>
          <input type="text" placeholder="Ej. Cardiólogo" value="${c.especialidad || ''}" oninput="updateContacto('${campo}',${i},'especialidad',this.value)">
        </div>
      </div>` : ''}
      <div class="row">
        <div style="flex:1">
          <span class="mini-label">Teléfono</span>
          <input type="tel" id="tel_${campo}_${i}" value="${c.telefono || ''}" oninput="updateContacto('${campo}',${i},'telefono',this.value)">
        </div>
        <button class="call-btn" onclick="llamarContacto('${campo}',${i})" aria-label="Llamar">${PHONE_ICON}</button>
      </div>
      <button class="remove-contact" onclick="removeContacto('${campo}',${i})">Eliminar contacto</button>
    </div>
  `).join('');
}

function llamarContacto(campo, i) {
  const numero = document.getElementById(`tel_${campo}_${i}`).value.trim();
  if (!numero) {
    alert('Añade un número de teléfono antes de llamar.');
    return;
  }
  window.location.href = 'tel:' + numero.replace(/\s+/g, '');
}

function addContactoPersonal() {
  emergencia.contactosPersonales.push({ nombre: '', telefono: '' });
  renderContactList('contactosPersonales', 'personalContactsList');
}

function addContactoMedico() {
  emergencia.contactosMedicos.push({ nombre: '', especialidad: '', telefono: '' });
  renderContactList('contactosMedicos', 'medicalContactsList', true);
}

function removeContacto(campo, i) {
  emergencia[campo].splice(i, 1);
  renderContactList(campo, campo === 'contactosPersonales' ? 'personalContactsList' : 'medicalContactsList', campo === 'contactosMedicos');
}

function updateContacto(campo, i, subcampo, valor) {
  emergencia[campo][i][subcampo] = valor;
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
