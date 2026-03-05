# ProtoR1 Backend

API backend para un sistema de gestion de entregas y logistica. Maneja rutas de choferes, asignacion de clientes, seguimiento de jornadas laborales y generacion de remitos con exportacion a PDF.

## Stack Tecnologico

- **Runtime:** Node.js + TypeScript
- **Framework:** Express 5
- **Base de datos:** PostgreSQL (Sequelize ORM)
- **Autenticacion:** JWT + bcrypt
- **Documentacion:** Swagger / OpenAPI 3.0
- **PDF:** PDFKit

## Estructura del Proyecto

```
src/
├── server.ts                      # Punto de entrada, configuracion de Express
├── config/
│   ├── database.ts                # Conexion a PostgreSQL
│   └── swagger.ts                 # Configuracion de OpenAPI
├── controllers/
│   ├── auth.controller.ts         # Login, registro, perfil
│   ├── user.controller.ts         # CRUD de usuarios
│   ├── jornada.controller.ts      # Check-in/check-out de jornadas
│   └── remito.controller.ts       # Creacion de remitos y PDF
├── models/
│   ├── index.ts                   # Asociaciones entre modelos
│   ├── User.ts                    # Modelo de usuario (admin/chofer/cliente)
│   ├── Assignment.ts              # Modelo de asignacion chofer-cliente
│   ├── Jornada.ts                 # Modelo de jornada laboral
│   └── Remito.ts                  # Modelo de remito de entrega
├── routes/
│   ├── auth.routes.ts             # Rutas de autenticacion
│   ├── user.routes.ts             # Rutas de usuarios
│   ├── assignments.routes.ts      # Rutas de asignaciones
│   ├── jornada.routes.ts          # Rutas de jornadas
│   └── remito.routes.ts           # Rutas de remitos
├── middleware/
│   └── auth.middleware.ts         # Autenticacion JWT y autorizacion por rol
├── types/
│   └── auth.ts                    # Interfaces y enums de TypeScript
└── docs/
    ├── auth.docs.ts               # Swagger docs de auth
    ├── user.docs.ts               # Swagger docs de usuarios
    ├── assignments.docs.ts        # Swagger docs de asignaciones
    ├── jornada.docs.ts            # Swagger docs de jornadas
    └── remitos.docs.ts            # Swagger docs de remitos
```

## Entidades Principales

| Entidad | Descripcion |
|---------|-------------|
| **User** | Tres roles: `ADMIN`, `CHOFER`, `CLIENTE`. Rastrea el estado de entrega. |
| **Assignment** | Vincula un chofer con un cliente para una tarea de entrega. |
| **Jornada** | Turno de trabajo del chofer con horarios de check-in/check-out y ubicaciones GPS. |
| **Remito** | Comprobante de entrega con lista de productos, IVA (21%) y generacion de PDF. |

## Endpoints de la API

### Auth (`/auth`)
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/auth/register` | Registrar el primer admin (solo funciona si no existe ninguno) |
| POST | `/auth/login` | Iniciar sesion y recibir un token JWT |
| GET | `/auth/me` | Obtener el perfil del usuario autenticado |

### Usuarios (`/users`) — Solo admin
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/users` | Crear un nuevo usuario |
| GET | `/users/search?search=` | Buscar usuario por ID, DNI o email |
| GET | `/users/role/:role` | Listar usuarios por rol |
| PUT | `/users/:id` | Actualizar un usuario |
| PUT | `/users/:id/reset-password` | Resetear la contrasenya de un usuario |
| PATCH | `/users/:id/reset-status` | Resetear el estado del cliente a DISPONIBLE |

### Asignaciones (`/assignments`)
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/assignments` | Asignar clientes a un chofer (admin) |
| GET | `/assignments/me` | Obtener mis clientes asignados (chofer) |
| GET | `/assignments/me/count` | Contar mis clientes asignados (chofer) |

### Jornadas (`/jornadas`)
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/jornadas/checkin` | Iniciar un turno de trabajo |
| POST | `/jornadas/checkout` | Finalizar un turno de trabajo |
| GET | `/jornadas/me` | Obtener mi turno activo |
| GET | `/jornadas/me/historial` | Obtener mi historial de turnos |
| GET | `/jornadas/activas` | Listar todos los turnos activos (admin) |
| GET | `/jornadas/chofer/:choferId` | Obtener historial de turnos de un chofer (admin) |

### Remitos (`/remitos`)
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/remitos` | Crear un remito de entrega |
| GET | `/remitos/me` | Listar mis remitos creados |
| GET | `/remitos/cliente/:clienteId` | Listar remitos de un cliente |
| GET | `/remitos/:id` | Obtener un remito |
| GET | `/remitos/:id/pdf` | Descargar remito en PDF |

## Flujo de Negocio

1. El **Admin** crea usuarios chofer y cliente.
2. El **Admin** asigna uno o mas clientes a un chofer.
3. El **Chofer** hace check-in para iniciar su jornada laboral.
4. El **Chofer** visita clientes y crea un remito por cada entrega.
   - La asignacion se marca como `done` y el estado del cliente cambia a `VISITADO`.
5. El **Chofer** hace check-out para finalizar su jornada.

## Documentacion de la API

Swagger UI interactivo disponible en `/api-docs` con el servidor corriendo.

## Variables de Entorno

| Variable | Descripcion | Default |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `3000` |
| `DB_HOST` | Host de PostgreSQL | — |
| `DB_PORT` | Puerto de PostgreSQL | `25060` |
| `DB_USER` | Usuario de PostgreSQL | — |
| `DB_PASS` | Contrasenya de PostgreSQL | — |
| `DB_NAME` | Nombre de la base de datos | — |
| `JWT_SECRET` | Clave secreta para firmar JWT | `your-secret-key` |

## Docker Compose (Desarrollo Local)

### Opcion recomendada: DB en Docker + backend local

Levantar solo la base de datos y el seed:

```bash
docker compose up db seed
```

Luego correr el backend localmente con hot reload:

```bash
npm run dev
```

Los cambios en el codigo se reflejan automaticamente sin necesidad de rebuild.

### Opcion alternativa: todo en Docker

```bash
docker compose up --build
```

El servidor estara disponible en `http://localhost:3000` y Swagger en `http://localhost:3000/api-docs`.

La base de datos se seedea automaticamente con datos de prueba:

| Usuario | Email | Rol |
|---------|-------|-----|
| Admin | admin@test.com | admin |
| Chofer 1 | chofer1@test.com | chofer |
| Chofer 2 | chofer2@test.com | chofer |
| Cliente 1 | cliente1@test.com | cliente |
| Cliente 2 | cliente2@test.com | cliente |
| Cliente 3 | cliente3@test.com | cliente |

Todos los usuarios usan la password: **`admin123`**

Tambien se crean asignaciones chofer-cliente automaticamente.

Para resetear la base de datos y empezar de cero:

```bash
docker compose down -v
docker compose up --build
```

El flag `-v` elimina el volumen de datos de PostgreSQL.

### Ver la base de datos

Con los contenedores corriendo, conectarse con `psql` desde la terminal:

```bash
docker compose exec db psql -U protor1 -d protor1
```

O usar un cliente GUI (DBeaver, TablePlus, pgAdmin, etc.) con:

| Campo | Valor |
|-------|-------|
| Host | `localhost` |
| Port | `5432` |
| User | `protor1` |
| Password | `protor1` |
| Database | `protor1` |

## Scripts

```bash
npm run dev    # Iniciar servidor de desarrollo con hot reload
npm run build  # Compilar TypeScript a /dist
npm start      # Ejecutar build de produccion compilado
```
