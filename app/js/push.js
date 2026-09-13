// Notificaciones push: pedir permiso, suscribir/desuscribir el dispositivo, y configurar
// el horario propio de cada franja (mañana/tarde/noche) con un interruptor y una hora en punto.
// La tarjeta vive en la pantalla de inicio y siempre está visible.

const FRANJAS_NOTIF = [
  { id: 'manana', label: 'Mañana' },
  { id: 'tarde', label: 'Tarde' },
  { id: 'noche', label: 'Noche' },
];

let notifConfigActual = {
  manana: { activo: false, hora: 8 },
  tarde: { activo: false, hora: 15 },
  noche: { activo: false, hora: 21 },
};

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

async function pushSoportado() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

async function getPushSubscriptionActual() {
  const registro = await navigator.serviceWorker.ready;
  return registro.pushManager.getSubscription();
}

async function asegurarSuscripcionPush() {
  const permiso = await Notification.requestPermission();
  if (permiso !== 'granted') {
    alert('No se han activado las notificaciones. Puedes activarlas más tarde desde los ajustes del sistema.');
    return false;
  }

  try {
    const keyRes = await fetch(`${API_URL}/push-public-key`);
    const keyData = await keyRes.json();
    if (!keyRes.ok) throw new Error(keyData.error || 'No se pudo obtener la clave de notificaciones.');

    const registro = await navigator.serviceWorker.ready;
    let suscripcion = await registro.pushManager.getSubscription();

    if (!suscripcion) {
      suscripcion = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
      });
    }

    const suscripcionJson = suscripcion.toJSON();
    const res = await apiFetch('/push-suscribir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: suscripcionJson.endpoint, keys: suscripcionJson.keys }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo guardar la suscripción.');

    return true;
  } catch (err) {
    alert('No se pudieron activar las notificaciones: ' + err.message);
    return false;
  }
}

function toggleNotifFranja(franjaId) {
  notifConfigActual[franjaId].activo = !notifConfigActual[franjaId].activo;
  renderHomeNotifCard();
}

function cambiarNotifHora(franjaId, hora) {
  notifConfigActual[franjaId].hora = parseInt(hora, 10);
}

async function guardarNotifConfig() {
  const btn = document.getElementById('notifSaveBtn');
  btn.disabled = true;
  btn.textContent = 'Guardando...';

  try {
    const hayAlgunaActiva = FRANJAS_NOTIF.some(f => notifConfigActual[f.id].activo);

    if (hayAlgunaActiva) {
      const suscripcion = await getPushSubscriptionActual();
      if (!suscripcion || Notification.permission !== 'granted') {
        const ok = await asegurarSuscripcionPush();
        if (!ok) { btn.disabled = false; btn.textContent = 'Guardar horarios'; return; }
      }
    }

    const res = await apiFetch('/notif-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notifConfigActual),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo guardar la configuración.');

    notifConfigActual = data;
    alert('Horarios de notificación guardados.');
  } catch (err) {
    alert('No se pudo guardar: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Guardar horarios';
    renderHomeNotifCard();
  }
}

function opcionesHora(seleccionada) {
  let html = '';
  for (let h = 0; h < 24; h++) {
    const label = String(h).padStart(2, '0') + ':00';
    html += `<option value="${h}" ${h === seleccionada ? 'selected' : ''}>${label}</option>`;
  }
  return html;
}

async function updateHomePushTask() {
  const contenedor = document.getElementById('homeTaskArea');
  if (!contenedor) return;

  if (!(await pushSoportado())) {
    contenedor.innerHTML = `
      <div class="home-task-title">Notificaciones</div>
      <div class="home-task-card">
        <div class="home-task-head">
          <div class="home-task-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <div class="home-task-text">
            <h4>No disponibles en este dispositivo</h4>
            <p class="notif-unavailable-text">Instala la app en la pantalla de inicio desde Safari, con iOS 16.4 o superior</p>
          </div>
        </div>
      </div>
    `;
    return;
  }

  try {
    const res = await apiFetch('/notif-config');
    const data = await res.json();
    if (res.ok) notifConfigActual = data;
  } catch (err) {
    // si falla la carga, se queda con los valores por defecto en memoria
  }

  renderHomeNotifCard();
}

function renderHomeNotifCard() {
  const contenedor = document.getElementById('homeTaskArea');
  if (!contenedor) return;

  const hayAlgunaActiva = FRANJAS_NOTIF.some(f => notifConfigActual[f.id].activo);

  contenedor.innerHTML = `
    <div class="home-task-title">Notificaciones</div>
    <div class="home-task-card">
      <div class="home-task-head">
        <div class="home-task-icon ${hayAlgunaActiva ? 'on' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>
        <div class="home-task-text">
          <h4>Recordatorios de ánimo</h4>
          <p>Elige a qué hora quieres que te avisemos en cada franja</p>
        </div>
      </div>

      ${FRANJAS_NOTIF.map(f => `
        <div class="notif-franja-row">
          <div class="notif-franja-info"><span class="n">${f.label}</span></div>
          <select class="notif-franja-select" onchange="cambiarNotifHora('${f.id}', this.value)" ${!notifConfigActual[f.id].activo ? 'disabled' : ''}>
            ${opcionesHora(notifConfigActual[f.id].hora)}
          </select>
          <button class="notif-switch ${notifConfigActual[f.id].activo ? 'on' : ''}" onclick="toggleNotifFranja('${f.id}')" aria-label="Activar ${f.label}">
            <span class="knob"></span>
          </button>
        </div>
      `).join('')}

      <button class="notif-save-btn" id="notifSaveBtn" onclick="guardarNotifConfig()">Guardar horarios</button>
    </div>
  `;
}
