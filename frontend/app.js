/* ------------------------------------------------------------------
 * Configuración: única línea a tocar para apuntar a otra máquina.
 * El backend corre en el MacBook; por Tailscale sería
 * http://100.77.247.114:3001
 * ------------------------------------------------------------------ */
const API_BASE = 'http://localhost:3001';

const form      = document.getElementById('login-form');
const userInput = document.getElementById('username');
const passInput = document.getElementById('password');
const errorBox  = document.getElementById('error');
const submitBtn = document.getElementById('submit');
const spinner   = submitBtn.querySelector('.spinner');
const btnLabel  = submitBtn.querySelector('.btn-label');

const loginView   = document.getElementById('login-view');
const successView = document.getElementById('success-view');
const whoEl       = document.getElementById('who');
const tokenEl     = document.getElementById('token');
const logoutBtn   = document.getElementById('logout');

const apiDot   = document.getElementById('api-dot');
const apiLabel = document.getElementById('api-label');

apiLabel.textContent = API_BASE;

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

function clearError() {
  errorBox.hidden = true;
  userInput.classList.remove('invalid');
  passInput.classList.remove('invalid');
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  spinner.hidden = !isLoading;
  btnLabel.textContent = isLoading ? 'Verificando…' : 'Entrar';
}

/* Sondea /api/health sólo para el indicador visual del pie. */
async function pingBackend() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    apiDot.className = res.ok ? 'dot up' : 'dot down';
  } catch {
    apiDot.className = 'dot down';
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError();

  const username = userInput.value.trim();
  const password = passInput.value;

  // Validación local: evita un viaje al servidor por algo que sabemos aquí.
  if (!username || !password) {
    if (!username) userInput.classList.add('invalid');
    if (!password) passInput.classList.add('invalid');
    showError('Completa usuario y contraseña.');
    return;
  }

  setLoading(true);

  try {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    // El contrato promete JSON en todos los casos, pero un proxy o un
    // backend a medio arrancar puede devolver otra cosa.
    let data;
    try {
      data = await res.json();
    } catch {
      showError(`Respuesta no válida del servidor (HTTP ${res.status}).`);
      return;
    }

    if (res.ok && data.success) {
      whoEl.textContent = data.user?.username ?? username;
      tokenEl.textContent = data.token ?? '(sin token)';
      loginView.hidden = true;
      successView.hidden = false;
      return;
    }

    showError(data.error || 'No se pudo iniciar sesión.');
    passInput.value = '';
    passInput.focus();

  } catch {
    // fetch sólo rechaza por fallo de red o CORS, no por status 4xx/5xx.
    apiDot.className = 'dot down';
    showError(`No hay conexión con el backend (${API_BASE}). ¿Está corriendo?`);
  } finally {
    setLoading(false);
  }
});

logoutBtn.addEventListener('click', () => {
  form.reset();
  clearError();
  successView.hidden = true;
  loginView.hidden = false;
  userInput.focus();
});

pingBackend();
