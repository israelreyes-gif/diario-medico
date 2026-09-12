// Notificaciones push: pedir permiso, suscribir el dispositivo, registrar el Service Worker.
// La tarjeta de "tarea pendiente" se muestra en la pantalla de inicio, no dentro de Bienestar.

const PUSH_TASK_DISMISSED_KEY = 'diario_medico_push_task_dismissed';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

async function pushSoportado() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

async function registrarServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  return navigator.serviceWorker.register('sw.js');
}

async function getPushSubscriptionActual() {
  const registro = await navigator.serviceWorker.ready;
  return registro.pushManager.getSubscription();
}

async function activarNotificacionesPush() {
  if (!(await pushSoportado())) {
    alert('Este dispositivo o navegador no soporta notificaciones push. En iPhone, asegúrate de tener la app instalada en la pantalla de inicio (no abierta desde Safari) y iOS 16.4 o superior.');
    return false;
  }

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
      body: JSON.stringify({
        endpoint: suscripcionJson.endpoint,
        keys: suscripcionJson.keys,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo guardar la suscripción.');

    return true;
  } catch (err) {
    alert('No se pudieron activar las notificaciones: ' + err.message);
    return false;
  }
}

function isPushTaskDismissed() {
  return localStorage.getItem(PUSH_TASK_DISMISSED_KEY) === '1';
}

function dismissPushTask() {
  localStorage.setItem(PUSH_TASK_DISMISSED_KEY, '1');
  updateHomePushTask();
}

// Pinta (o esconde) la tarjeta de tarea pendiente en la pantalla de inicio, según:
// - si el dispositivo soporta push
// - si el usuario ya la descartó con la X
// - si las notificaciones ya están activas (en ese caso, deja de ser una tarea pendiente)
async function updateHomePushTask() {
  const contenedor = document.getElementById('homeTaskArea');
  if (!contenedor) return;

  if (isPushTaskDismissed()) {
    contenedor.innerHTML = '';
    return;
  }

  if (!(await pushSoportado())) {
    contenedor.innerHTML = '';
    return;
  }

  const suscripcion = await getPushSubscriptionActual();
  const yaActivas = suscripcion && Notification.permission === 'granted';

  if (yaActivas) {
    contenedor.innerHTML = '';
    return;
  }

  contenedor.innerHTML = `
    <div class="home-task-title">Tareas pendientes</div>
    <div class="home-task-card">
      <div class="home-task-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      </div>
      <div class="home-task-text">
        <h4>Activar notificaciones</h4>
        <p>Recibe un recordatorio al empezar mañana, tarde y noche para registrar tu ánimo</p>
      </div>
      <div class="home-task-actions">
        <button class="home-task-btn" onclick="onHomeActivatePush()">Activar</button>
        <button class="home-task-dismiss" onclick="dismissPushTask()" aria-label="Descartar">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
        </button>
      </div>
    </div>
  `;
}

async function onHomeActivatePush() {
  const ok = await activarNotificacionesPush();
  await updateHomePushTask();
  if (ok) {
    alert('Notificaciones activadas. Te avisaremos al empezar cada franja (mañana, tarde y noche) si no has registrado tu estado.');
  }
}
