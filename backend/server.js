'use strict';

const http = require('http');
const crypto = require('crypto');

const PORT = process.env.PORT || 3001;

// Credenciales validas UNICAS del sistema.
const USUARIO_VALIDO = 'erick';
const PASSWORD_VALIDA = 'erick123';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function log(req, status) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} -> ${status}`);
}

function enviarJSON(req, res, status, payload) {
  const cuerpo = JSON.stringify(payload);
  res.writeHead(status, {
    ...CORS_HEADERS,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(cuerpo),
  });
  res.end(cuerpo);
  log(req, status);
}

function leerCuerpo(req) {
  return new Promise((resolve, reject) => {
    const trozos = [];
    let total = 0;
    req.on('data', (trozo) => {
      total += trozo.length;
      // Corta cuerpos absurdamente grandes: este endpoint solo recibe credenciales.
      if (total > 1e6) {
        reject(new Error('Cuerpo demasiado grande'));
        req.destroy();
        return;
      }
      trozos.push(trozo);
    });
    req.on('end', () => resolve(Buffer.concat(trozos).toString('utf8')));
    req.on('error', reject);
  });
}

async function manejarLogin(req, res) {
  let datos;
  try {
    const crudo = await leerCuerpo(req);
    datos = JSON.parse(crudo);
  } catch (err) {
    return enviarJSON(req, res, 400, { success: false, error: 'Faltan credenciales' });
  }

  if (datos === null || typeof datos !== 'object' || Array.isArray(datos)) {
    return enviarJSON(req, res, 400, { success: false, error: 'Faltan credenciales' });
  }

  const { username, password } = datos;
  if (typeof username !== 'string' || username === '' ||
      typeof password !== 'string' || password === '') {
    return enviarJSON(req, res, 400, { success: false, error: 'Faltan credenciales' });
  }

  if (username !== USUARIO_VALIDO || password !== PASSWORD_VALIDA) {
    return enviarJSON(req, res, 401, { success: false, error: 'Credenciales invalidas' });
  }

  return enviarJSON(req, res, 200, {
    success: true,
    user: { username: USUARIO_VALIDO },
    token: crypto.randomBytes(32).toString('hex'),
  });
}

const servidor = http.createServer((req, res) => {
  const ruta = req.url.split('?')[0];

  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    log(req, 204);
    return;
  }

  if (req.method === 'POST' && ruta === '/api/login') {
    manejarLogin(req, res).catch(() => {
      enviarJSON(req, res, 400, { success: false, error: 'Faltan credenciales' });
    });
    return;
  }

  if (req.method === 'GET' && ruta === '/api/health') {
    return enviarJSON(req, res, 200, { status: 'ok' });
  }

  return enviarJSON(req, res, 404, { success: false, error: 'No encontrado' });
});

servidor.listen(PORT, () => {
  console.log(`Backend de login escuchando en http://localhost:${PORT}`);
});
