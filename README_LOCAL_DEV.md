# Guia de Desarrollo Local

Instrucciones paso a paso para correr y probar el backend de ProtoR1 en tu maquina.

## Prerequisitos

- **Node.js** (v18 o superior)
- **npm**
- **PostgreSQL** (instancia local o Docker)

## 1. Clonar e Instalar

```bash
git clone <repo-url>
cd prototipoR1-backend
npm install
```

## 2. Configurar PostgreSQL

### Opcion A: Docker Compose (recomendado)

Levantar la base de datos y seedear datos de prueba:

```bash
docker compose up db seed
```

Esto crea un PostgreSQL con los datos de prueba listos. La DB queda corriendo en segundo plano y el backend se corre localmente con `npm run dev` (ver paso 6).

### Opcion B: Docker manual

```bash
docker run -d \
  --name protor1-db \
  -e POSTGRES_USER=protor1 \
  -e POSTGRES_PASSWORD=protor1 \
  -e POSTGRES_DB=protor1 \
  -p 5432:5432 \
  postgres:16
```

### Opcion C: PostgreSQL Local

Crear una base de datos usando `psql`:

```bash
psql -U postgres
CREATE DATABASE protor1;
CREATE USER protor1 WITH PASSWORD 'protor1';
GRANT ALL PRIVILEGES ON DATABASE protor1 TO protor1;
\q
```

## 3. Variables de Entorno

El archivo `local.env` ya esta incluido en el repositorio con la configuracion para desarrollo local. Los scripts `npm run dev` y `npm run seed` lo cargan automaticamente.

> **Nota:** Para produccion o staging se usa un `.env` separado (no commiteado). El `local.env` solo se usa para desarrollo local.

## 4. Deshabilitar SSL para BD Local

El archivo `local.env` ya incluye `DB_SSL=false`. La configuracion de la base de datos en `src/config/database.ts` respeta esta variable.

Un enfoque rapido es agregar una variable de entorno `DB_SSL`. Reemplazar el bloque `dialectOptions` en `src/config/database.ts`:

```ts
dialectOptions: process.env.DB_SSL === "false"
  ? {}
  : {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
```

Luego agregar en tu `.env`:

```env
DB_SSL=false
```

Alternativamente, se puede comentar temporalmente el bloque `dialectOptions` mientras se desarrolla localmente.

## 5. Seedear la Base de Datos (opcional)

Para cargar datos de prueba (admin, choferes, clientes y asignaciones):

```bash
npm run seed
```

Esto crea los siguientes usuarios (todos con password `admin123`):

| Email | Rol |
|-------|-----|
| admin@test.com | admin |
| chofer1@test.com | chofer |
| chofer2@test.com | chofer |
| cliente1@test.com | cliente |
| cliente2@test.com | cliente |
| cliente3@test.com | cliente |

El seed se saltea automaticamente si ya existe un admin en la base de datos.

> **Nota:** Si usas Docker Compose, el seed se ejecuta automaticamente antes de iniciar el backend.

## 6. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

El servidor se iniciara en `http://localhost:3000` (o el `PORT` que hayas configurado). Sequelize sincronizara el esquema de la base de datos automaticamente al iniciar.

No deberian aparecer errores en la consola si la conexion a la base de datos es exitosa.

## 7. Probar la API

### Swagger UI

Abrir [http://localhost:3000/api-docs](http://localhost:3000/api-docs) en el navegador para el explorador interactivo de la API.

### Usando cURL

**Registrar el primer admin:**

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123",
    "nombre": "Admin",
    "dni": "12345678",
    "cuit": "20-12345678-9",
    "telefono": "1234567890",
    "ubicacion": "Buenos Aires",
    "usuario": "admin"
  }'
```

**Iniciar sesion:**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123"
  }'
```

Guardar el valor del `token` devuelto. Usarlo en las siguientes requests:

```bash
export TOKEN="<pegar-token-aqui>"
```

**Crear un chofer:**

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "chofer@test.com",
    "password": "chofer123",
    "role": "CHOFER",
    "nombre": "Juan Perez",
    "dni": "87654321",
    "cuit": "20-87654321-0",
    "telefono": "0987654321",
    "ubicacion": "Rosario",
    "usuario": "jperez"
  }'
```

**Crear un cliente:**

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "cliente@test.com",
    "password": "cliente123",
    "role": "CLIENTE",
    "nombre": "Kiosco Central",
    "dni": "11223344",
    "cuit": "20-11223344-5",
    "telefono": "1122334455",
    "ubicacion": "Cordoba",
    "razonSocial": "Kiosco Central SRL",
    "tipoComercio": "Kiosco",
    "usuario": "kcentral"
  }'
```

**Listar todos los choferes:**

```bash
curl http://localhost:3000/users/role/CHOFER \
  -H "Authorization: Bearer $TOKEN"
```

**Verificar usuario autenticado:**

```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

## 8. Test del Flujo Completo

Una vez creados un admin, un chofer y un cliente:

1. **Asignar cliente al chofer** (como admin):
   ```bash
   curl -X POST http://localhost:3000/assignments \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{ "choferId": "<uuid-del-chofer>", "clientIds": ["<uuid-del-cliente>"] }'
   ```

2. **Iniciar sesion como el chofer** y obtener su token.

3. **Hacer check-in** (como chofer):
   ```bash
   curl -X POST http://localhost:3000/jornadas/checkin \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $DRIVER_TOKEN" \
     -d '{ "ubicacionCheckIn": "Rosario Centro" }'
   ```

4. **Crear un remito** (como chofer):
   ```bash
   curl -X POST http://localhost:3000/remitos \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $DRIVER_TOKEN" \
     -d '{
       "clienteId": "<uuid-del-cliente>",
       "productos": [
         { "nombre": "Agua 500ml", "cantidad": 10, "precio": 500 }
       ],
       "notas": "Entregado sin problemas"
     }'
   ```

5. **Descargar el PDF**:
   ```bash
   curl http://localhost:3000/remitos/<uuid-del-remito>/pdf \
     -H "Authorization: Bearer $DRIVER_TOKEN" \
     -o remito.pdf
   ```

6. **Hacer check-out** (como chofer):
   ```bash
   curl -X POST http://localhost:3000/jornadas/checkout \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $DRIVER_TOKEN" \
     -d '{ "ubicacionCheckOut": "Rosario Centro" }'
   ```

## 9. Ver la Base de Datos

### Desde la terminal

```bash
docker compose exec db psql -U protor1 -d protor1
```

Comandos utiles de `psql`:

| Comando | Descripcion |
|---------|-------------|
| `\dt` | Listar todas las tablas |
| `SELECT * FROM "Users";` | Ver todos los usuarios |
| `SELECT * FROM "Assignments";` | Ver asignaciones |
| `\q` | Salir |

### Usando un cliente GUI

Conectarse con DBeaver, TablePlus, pgAdmin o la extension de PostgreSQL de VS Code usando:

| Campo | Valor |
|-------|-------|
| Host | `localhost` |
| Port | `5432` |
| User | `protor1` |
| Password | `protor1` |
| Database | `protor1` |

## 10. Resetear la Base de Datos

Si usas Docker Compose, podes limpiar todo y empezar de cero con:

```bash
docker compose down -v
docker compose up --build
```

El flag `-v` elimina el volumen `pgdata`, borrando todos los datos de PostgreSQL. La proxima vez que levantes los contenedores, la base de datos se creara vacia y Sequelize sincronizara el esquema automaticamente.

Si usas PostgreSQL local (sin Docker Compose), podes recrear la base de datos manualmente:

```bash
psql -U postgres
DROP DATABASE protor1;
CREATE DATABASE protor1;
GRANT ALL PRIVILEGES ON DATABASE protor1 TO protor1;
\q
```

## Solucion de Problemas

| Problema | Solucion |
|----------|----------|
| `ECONNREFUSED` en conexion a BD | Verificar que PostgreSQL este corriendo y que los valores en `.env` sean correctos |
| Error de SSL con BD local | Ver paso 4 — deshabilitar SSL para desarrollo local |
| `relation does not exist` | Sequelize sincroniza automaticamente al iniciar; reiniciar el servidor |
| `403 Forbidden` | Verificar que se este usando el token del rol correcto para el endpoint |
| Puerto en uso | Cambiar `PORT` en `.env` o matar el proceso que esta usando ese puerto |
