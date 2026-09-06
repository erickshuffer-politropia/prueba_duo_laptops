# Contrato de API — App de login

Acordado por el coordinador **antes** de repartir el trabajo, para que frontend y
backend pudieran construirse en paralelo en máquinas distintas sin bloquearse.

| Pieza | Máquina | Rama |
|---|---|---|
| Frontend (`frontend/`) | PC Windows | `frontend-login` |
| Backend (`backend/`) | MacBook | `erickshuffer-politropia/backend-login` |

**Base URL:** `http://localhost:3001` (puerto configurable con `PORT`).
En el frontend se cambia en la constante `API_BASE`, al inicio de `frontend/app.js`.

## CORS

Presente en todas las respuestas. `OPTIONS` (preflight) responde `204`.

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

## `POST /api/login`

```json
{ "username": "erick", "password": "erick123" }
```

| Caso | Status | Cuerpo |
|---|---|---|
| Credenciales correctas | `200` | `{"success": true, "user": {"username": "erick"}, "token": "<no vacío>"}` |
| Credenciales incorrectas | `401` | `{"success": false, "error": "Credenciales invalidas"}` |
| Falta un campo o JSON inválido | `400` | `{"success": false, "error": "Faltan credenciales"}` |

## `GET /api/health`

`200` → `{"status": "ok"}`. El frontend lo usa para el indicador del pie de página.

## Cualquier otra ruta

`404` → `{"success": false, "error": "No encontrado"}`

## Nota

Las credenciales están fijas en el código y el "token" no se valida en ninguna
petición posterior. Es deliberado: esto es un experimento de coordinación entre
dos máquinas, no una implementación de autenticación.
