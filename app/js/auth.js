// Login, registro, y cambio entre las dos pantallas (acceso / app)

function toggleAuthMode() {
  authMode = authMode === 'login' ? 'register' : 'login';
  const esRegistro = authMode === 'register';

  document.getElementById('authSubtitle').textContent =
    esRegistro ? 'Crea una cuenta nueva' : 'Inicia sesión para ver tu pastillero';
  document.getElementById('authSubmitBtn').textContent = esRegistro ? 'Crear cuenta' : 'Entrar';
  document.getElementById('authSwitchBtn').textContent =
    esRegistro ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate';
  document.getElementById('fieldNombreCompleto').style.display = esRegistro ? 'block' : 'none';
  document.getElementById('fieldConfirmPassword').style.display = esRegistro ? 'block' : 'none';
  document.getElementById('authError').classList.remove('show');
}

function passwordEsSegura(password) {
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
}

async function submitAuth() {
  const usuario = document.getElementById('authUser').value.trim();
  const password = document.getElementById('authPassword').value;
  const errorEl = document.getElementById('authError');
  const btn = document.getElementById('authSubmitBtn');
  errorEl.classList.remove('show');

  if (!usuario || !password) {
    errorEl.textContent = 'Rellena usuario y contraseña.';
    errorEl.classList.add('show');
    return;
  }

  let nombreCompleto = '';
  if (authMode === 'register') {
    nombreCompleto = document.getElementById('authNombreCompleto').value.trim();
    const passwordConfirm = document.getElementById('authPasswordConfirm').value;

    if (!nombreCompleto) {
      errorEl.textContent = 'Indica tu nombre y apellidos.';
      errorEl.classList.add('show');
      return;
    }
    if (!passwordEsSegura(password)) {
      errorEl.textContent = 'La contraseña debe tener al menos 8 caracteres, con letras y números.';
      errorEl.classList.add('show');
      return;
    }
    if (password !== passwordConfirm) {
      errorEl.textContent = 'Las contraseñas no coinciden.';
      errorEl.classList.add('show');
      return;
    }
  }

  const endpoint = authMode === 'login' ? '/login' : '/register';
  btn.disabled = true;
  btn.textContent = authMode === 'login' ? 'Entrando...' : 'Creando...';

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password, nombreCompleto }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al acceder');

    guardarSesion(data.token, data.usuario, data.nombreCompleto);
    mostrarApp();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.add('show');
  } finally {
    btn.disabled = false;
    btn.textContent = authMode === 'login' ? 'Entrar' : 'Crear cuenta';
  }
}

async function logout() {
  const confirmado = confirm('¿Cerrar sesión?');
  if (!confirmado) return;
  try {
    await fetch(`${API_URL}/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  } catch (err) {}
  borrarSesion();
  mostrarAuth();
}

function mostrarAuth() {
  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('appScreen').style.display = 'none';
  document.getElementById('authUser').value = '';
  document.getElementById('authPassword').value = '';
}

function mostrarApp() {
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('appScreen').style.display = 'flex';
  document.getElementById('userLabel').textContent = getNombreCompleto() || getUsuario();
  loadMedicamentos();
}
