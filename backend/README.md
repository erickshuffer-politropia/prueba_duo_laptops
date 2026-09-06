# Backend de login

Servidor HTTP en Node.js puro (modulo `http` nativo). **Cero dependencias**: no hay
`package.json` que instalar, no hay `npm install`, no hay Express.

## Requisitos

- Node.js 18 o superior (probado con v24.14.1).

## Como arrancarlo

Desde la raiz del repositorio:

```bash
node backend/server.js
```

Salida esperada:

```
Backend de login escuchando en http://localhost:3001
```

El puerto por defecto es **3001**. Se puede cambiar con la variable de entorno `PORT`:

```bash
PORT=4000 node backend/server.js
```

Cada peticion recibida se registra por consola con metodo, ruta y status devuelto:

```
[2026-09-06T23:08:48.089Z] POST /api/login -> 200
```

Para detenerlo: `Ctrl+C`.

## CORS

Todas las respuestas (incluidos los errores) llevan estas cabeceras:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

Las peticiones `OPTIONS` (preflight) se responden con **204** y esas mismas cabeceras,
asi que el frontend puede llamar al backend desde cualquier origen sin proxy.

## Credenciales validas

Hay un unico usuario valido, hardcodeado:

| username | password   |
|----------|------------|
| `erick`  | `erick123` |

## Endpoints

### `POST /api/login`

Cuerpo (`application/json`):

```json
{ "username": "<string>", "password": "<string>" }
```

Respuestas (siempre `application/json`):

| Caso                                                       | Status | Cuerpo                                                                        |
|------------------------------------------------------------|--------|-------------------------------------------------------------------------------|
| Credenciales correctas                                     | 200    | `{"success":true,"user":{"username":"erick"},"token":"<hex de 64 caracteres>"}` |
| Credenciales incorrectas                                   | 401    | `{"success":false,"error":"Credenciales invalidas"}`                          |
| Falta `username` o `password`, o el body no es JSON valido | 400    | `{"success":false,"error":"Faltan credenciales"}`                             |

El `token` es un string hexadecimal aleatorio generado con `crypto.randomBytes(32)`.
No es un JWT y el servidor no lo guarda: sirve para que el frontend tenga algo que
almacenar tras el login.

### `GET /api/health`

Siempre responde **200** con `{"status":"ok"}`.

### Cualquier otra ruta

Responde **404** con `{"success":false,"error":"No encontrado"}`.

## Ejemplos con curl

Arranca el servidor en una terminal y ejecuta estos comandos en otra.

### 1. Login correcto -> 200

```bash
curl -i -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"erick","password":"erick123"}'
```

```
HTTP/1.1 200 OK
Content-Type: application/json

{"success":true,"user":{"username":"erick"},"token":"66a2181b012ba2f488b5efccce32a9fe3375f0002813b51b58acb45af57f85c7"}
```

### 2. Password incorrecta -> 401

```bash
curl -i -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"erick","password":"malapass"}'
```

```
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{"success":false,"error":"Credenciales invalidas"}
```

### 3. Usuario inexistente -> 401

```bash
curl -i -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"nadie","password":"erick123"}'
```

```
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{"success":false,"error":"Credenciales invalidas"}
```

### 4. Falta un campo -> 400

```bash
curl -i -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"erick"}'
```

```
HTTP/1.1 400 Bad Request
Content-Type: application/json

{"success":false,"error":"Faltan credenciales"}
```

### 5. Body que no es JSON valido -> 400

```bash
curl -i -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d 'esto no es json'
```

```
HTTP/1.1 400 Bad Request
Content-Type: application/json

{"success":false,"error":"Faltan credenciales"}
```

### 6. Health check -> 200

```bash
curl -i http://localhost:3001/api/health
```

```
HTTP/1.1 200 OK
Content-Type: application/json

{"status":"ok"}
```

### 7. Ruta inexistente -> 404

```bash
curl -i http://localhost:3001/api/loquesea
```

```
HTTP/1.1 404 Not Found
Content-Type: application/json

{"success":false,"error":"No encontrado"}
```

### 8. Preflight CORS -> 204

```bash
curl -i -X OPTIONS http://localhost:3001/api/login \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
```

```
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

## Nota de seguridad

Las credenciales estan hardcodeadas en texto plano y el token no se valida en ninguna
peticion posterior. Esto es una demo de integracion frontend/backend, no un sistema de
autenticacion para produccion.
