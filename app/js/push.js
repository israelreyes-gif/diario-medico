// Notificaciones push: pedir permiso, suscribir/desuscribir el dispositivo, registrar el Service Worker.
// La tarjeta vive en la pantalla de inicio y siempre está visible, mostrando "Activar" o
// "Notificaciones activadas" (con opción de desactivar) según el estado actual.

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

async function desactivarNotificacionesPush() {
  try {
    const suscripcion = await getPushSubscriptionActual();
    if (suscripcion) {
      const endpoint = suscripcion.endpoint;
      await suscripcion.unsubscribe();
      await apiFetch('/push-desuscribir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      });
    }
    return true;
  } catch (err) {
    alert('No se pudieron desactivar las notificaciones: ' + err.message);
    return false;
  }
}

// Pinta la tarjeta de notificaciones en la pantalla de inicio, siempre visible,
// con el aspecto que corresponda según si están activas o no.
async function updateHomePushTask() {
  const contenedor = document.getElementById('homeTaskArea');
  if (!contenedor) return;

  if (!(await pushSoportado())) {
    contenedor.innerHTML = `
      <div class="home-task-title">Notificaciones</div>
      <div class="home-task-card">
        <div class="home-task-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>
        <div class="home-task-text">
          <h4>No disponibles en este dispositivo</h4>
          <p>Instala la app en la pantalla de inicio desde Safari, con iOS 16.4 o superior</p>
        </div>
      </div>
    `;
    return;
  }

  const suscripcion = await getPushSubscriptionActual();
  const activas = suscripcion && Notification.permission === 'granted';

  contenedor.innerHTML = `
    <div class="home-task-title">Notificaciones</div>
    <div class="home-task-card">
      <div class="home-task-icon ${activas ? 'on' : ''}">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      </div>
      <div class="home-task-text">
        <h4>${activas ? 'Notificaciones activadas' : 'Activar notificaciones'}</h4>
        <p>${activas ? 'Te avisamos al empezar mañana, tarde y noche' : 'Recibe un recordatorio para registrar tu ánimo'}</p>
      </div>
      <button class="home-task-btn ${activas ? 'off' : ''}" onclick="${activas ? 'onHomeDeactivatePush()' : 'onHomeActivatePush()'}">${activas ? 'Desactivar' : 'Activar'}</button>
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

async function onHomeDeactivatePush() {
  const confirmado = confirm('¿Desactivar las notificaciones de recordatorio?');
  if (!confirmado) return;
  await desactivarNotificacionesPush();
  await updateHomePushTask();
}
