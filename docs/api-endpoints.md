# API Endpoints - Frontend Integration Guide

Base URL: `https://your-app.ondigitalocean.app`

## Authentication

All protected endpoints require the `Authorization` header:

```
Authorization: Bearer <token>
```

Token is obtained from `/auth/login` or `/auth/register` and expires in 24 hours.

---

## Auth (`/auth`)
Authentication and session management. Returns JWT tokens used for all protected endpoints.

### POST `/auth/register`
**Auth:** None

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "123456",
  "nombre": "Admin User",
  "dni": "12345678",
  "cuit": "20-12345678-9",
  "telefono": "1234567890",
  "ubicacion": "Buenos Aires",
  "razonSocial": "(optional)",
  "tipoComercio": "(optional)",
  "notas": "(optional)",
  "foto": "(optional)",
  "usuario": "(optional)",
  "codigoArea": "(optional)"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": { "id": "uuid", "email": "admin@example.com", "role": "admin", "nombre": "Admin User" },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Notes:** Only works for the first user (creates admin). After that, use `POST /users` as admin.

---

### POST `/auth/login`
**Auth:** None

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "123456"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": { "id": "uuid", "email": "admin@example.com", "role": "admin", "nombre": "Admin User" },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### GET `/auth/me`
**Auth:** Bearer token (any role)

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Authenticated",
  "user": { "id": "uuid", "email": "admin@example.com", "role": "admin", "nombre": "Admin User" }
}
```

---

## Users (`/users`)
Manage system users. Three roles exist: **admin** (manages everything), **chofer** (driver who delivers products and visits clients), and **cliente** (customer who receives deliveries).

### POST `/users/`
**Auth:** Bearer token | Role: `admin`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "chofer@example.com",
  "password": "123456",
  "role": "chofer",
  "nombre": "Juan Perez",
  "dni": "87654321",
  "cuit": "20-87654321-0",
  "telefono": "0987654321",
  "ubicacion": "Cordoba",
  "razonSocial": "(optional)",
  "tipoComercio": "(optional)",
  "notas": "(optional)",
  "foto": "(optional)",
  "usuario": "(optional)",
  "codigoArea": "(optional)"
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "user": { "id": "uuid", "email": "chofer@example.com", "role": "chofer", "nombre": "Juan Perez" }
}
```

---

### GET `/users/search?search=<query>`
**Auth:** Bearer token (any role)

**Query Parameters:**
- `search` — UUID id, DNI, or email

**Response (200):**
```json
{
  "user": { "id": "uuid", "email": "...", "nombre": "...", "role": "...", "dni": "...", "cuit": "...", ... }
}
```

---

### GET `/users/role/:role`
**Auth:** Bearer token (any role)

**Path Parameters:**
- `role` — `admin`, `chofer`, or `cliente`

**Response (200):**
```json
{
  "count": 5,
  "users": [
    { "id": "uuid", "nombre": "...", "email": "...", "role": "chofer", ... }
  ]
}
```

---

### PUT `/users/:id`
**Auth:** Bearer token | Role: `admin`

**Path Parameters:**
- `id` — User UUID

**Request Body (all fields optional):**
```json
{
  "nombre": "Updated Name",
  "dni": "12345678",
  "cuit": "20-12345678-9",
  "telefono": "1234567890",
  "ubicacion": "New Location",
  "razonSocial": "...",
  "tipoComercio": "...",
  "notas": "...",
  "foto": "...",
  "role": "chofer",
  "usuario": "...",
  "codigoArea": "..."
}
```

**Response (200):**
```json
{
  "message": "User updated successfully",
  "user": { ... }
}
```

---

### PUT `/users/:id/reset-password`
**Auth:** Bearer token | Role: `admin`

**Request Body:**
```json
{
  "newPassword": "newpassword123"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully",
  "userId": "uuid",
  "email": "user@example.com"
}
```

---

### PATCH `/users/:id/reset-status`
**Auth:** Bearer token | Role: `admin`

**Response (200):**
```json
{
  "message": "Client status reset to disponible",
  "userId": "uuid",
  "status": "disponible"
}
```

**Notes:** Only works for users with role `cliente`.

---

## Assignments (`/assignments`)
Assignments link chofers to clients. An admin assigns a list of clients to a chofer for delivery. Once the chofer visits the client and creates a remito, the assignment is marked as done.

### POST `/assignments/`
**Auth:** Bearer token | Role: `admin`

**Request Body:**
```json
{
  "choferId": "chofer-uuid",
  "clientIds": ["client-uuid-1", "client-uuid-2"]
}
```

**Response (201):**
```json
{
  "message": "Clients assigned successfully",
  "count": 2,
  "choferId": "chofer-uuid",
  "clientIds": ["client-uuid-1", "client-uuid-2"]
}
```

**Notes:** Updates client status to `asignado`. Ignores duplicates.

---

### GET `/assignments/me/count`
**Auth:** Bearer token | Role: `chofer`

**Response (200):**
```json
{
  "count": 5
}
```

---

### GET `/assignments/me`
**Auth:** Bearer token | Role: `chofer`

**Response (200):**
```json
{
  "clientes": [
    { "id": "uuid", "nombre": "Client Name", "ubicacion": "Address", "status": "asignado" }
  ]
}
```

---

## Jornadas (`/jornadas`)
A jornada is a work shift. Chofers check in at the start of their day and check out when finished. Tracks shift duration and activity.

### POST `/jornadas/checkin`
**Auth:** Bearer token | Role: `chofer`

**Request Body (optional):**
```json
{
  "ubicacion": "Starting location",
  "notas": "Notes"
}
```

**Response (201):**
```json
{
  "message": "Check-in exitoso",
  "jornada": { "id": "uuid", "choferId": "uuid", "checkin": "2026-03-05T...", ... }
}
```

**Notes:** Only one active jornada allowed per chofer.

---

### POST `/jornadas/checkout`
**Auth:** Bearer token | Role: `chofer`

**Request Body (optional):**
```json
{
  "ubicacion": "End location",
  "notas": "Notes"
}
```

**Response (200):**
```json
{
  "message": "Check-out exitoso",
  "jornada": { "id": "uuid", "checkin": "...", "checkout": "...", "duracionMinutos": 480, "duracionFormateada": "8h 0m" }
}
```

---

### GET `/jornadas/me`
**Auth:** Bearer token | Role: `chofer`

**Response (200):**
```json
{
  "activa": true,
  "jornada": { "id": "uuid", "checkin": "...", "tiempoTranscurrido": "2h 30m" }
}
```

---

### GET `/jornadas/me/historial?limite=30`
**Auth:** Bearer token | Role: `chofer`

**Query Parameters:**
- `limite` — Max results (default: 30)

**Response (200):**
```json
{
  "count": 10,
  "jornadas": [
    { "id": "uuid", "checkin": "...", "checkout": "...", "duracionMinutos": 480, "duracionFormateada": "8h 0m" }
  ]
}
```

---

### GET `/jornadas/activas`
**Auth:** Bearer token | Role: `admin`

**Response (200):**
```json
{
  "count": 3,
  "choferesActivos": [
    { "id": "uuid", "choferId": "uuid", "checkin": "...", "tiempoTranscurrido": "2h 30m" }
  ]
}
```

---

### GET `/jornadas/chofer/:choferId?limite=30&fechaInicio=2026-01-01&fechaFin=2026-03-05`
**Auth:** Bearer token | Role: `admin`

**Path Parameters:**
- `choferId` — Chofer UUID

**Query Parameters:**
- `limite` — Max results (default: 30)
- `fechaInicio` — Start date filter (YYYY-MM-DD, optional)
- `fechaFin` — End date filter (YYYY-MM-DD, optional)

**Response (200):**
```json
{
  "chofer": { "id": "uuid", "nombre": "..." },
  "resumen": { "totalJornadas": 20, "jornadasCompletadas": 18, "tiempoTotal": "144h 30m" },
  "jornadas": [ ... ]
}
```

---

## Remitos (`/remitos`)
A remito is a delivery receipt/invoice. Created by a chofer when visiting a client, listing the products delivered with quantities, prices, subtotal, 21% IVA tax, and total.

### POST `/remitos/`
**Auth:** Bearer token | Role: `chofer`

**Request Body:**
```json
{
  "clienteId": "client-uuid",
  "productos": [
    { "nombre": "Aceite 5L", "cantidad": 10, "precio": 5000 },
    { "nombre": "Aceite 20L", "cantidad": 2, "precio": 15000 }
  ],
  "notas": "(optional)"
}
```

**Response (201):**
```json
{
  "message": "Remito creado exitosamente",
  "remito": { "id": "uuid", "subtotal": 80000, "iva": 16800, "total": 96800, "productos": [...] },
  "assignment": { ... },
  "cliente": { "status": "visitado" }
}
```

**Notes:** Auto-calculates subtotal, 21% IVA, and total. Updates assignment to "done" and client status to `visitado`.

---

### GET `/remitos/me`
**Auth:** Bearer token | Role: `chofer`

**Response (200):**
```json
{
  "count": 5,
  "remitos": [ ... ]
}
```

---

### GET `/remitos/cliente/:clienteId`
**Auth:** Bearer token (any role)

**Response (200):**
```json
{
  "count": 3,
  "remitos": [ ... ]
}
```

---

### GET `/remitos/:id`
**Auth:** Bearer token (any role)

**Response (200):**
```json
{
  "remito": {
    "id": "uuid",
    "productos": [...],
    "subtotal": 80000,
    "iva": 16800,
    "total": 96800,
    "cliente": { "id": "uuid", "nombre": "...", "cuit": "...", "ubicacion": "..." },
    "chofer": { "id": "uuid", "nombre": "..." }
  }
}
```

---

### GET `/remitos/:id/pdf`
**Auth:** Bearer token (any role)

**Response:** PDF file download (`Content-Type: application/pdf`)

---

## Location Tracking (`/locations`)
Real-time GPS tracking for chofers. The Kotlin mobile app sends the chofer's location every 20-30 seconds. The admin dashboard can view live positions, route history, and heatmaps of delivery zones.

### POST `/locations/`
**Auth:** Bearer token | Role: `chofer`

**Request Body:**
```json
{
  "latitude": -34.6037,
  "longitude": -58.3816,
  "speed": 45.2,
  "heading": 180.0,
  "timestamp": "2026-03-05T20:00:00Z"
}
```

All optional except `latitude` and `longitude`:
- `latitude` — Range: -90 to 90
- `longitude` — Range: -180 to 180
- `speed` — km/h (optional)
- `heading` — degrees 0-360 (optional)
- `timestamp` — ISO date from device (optional, defaults to server time)
- `jornadaId` — UUID (optional, auto-links to active jornada if omitted)

**Response (200):**
```json
{
  "message": "Location updated",
  "location": {
    "choferId": "uuid",
    "latitude": -34.6037,
    "longitude": -58.3816,
    "speed": 45.2,
    "heading": 180.0,
    "timestamp": "2026-03-05T20:00:00.000Z",
    "jornadaId": "uuid"
  }
}
```

**Frontend integration (Kotlin app):**
- Call every 20-30 seconds from a foreground service
- Use `FusedLocationProviderClient` for battery-efficient GPS
- Queue requests locally if offline, retry on reconnect

---

### GET `/locations/`
**Auth:** Bearer token | Role: `admin`

**Query Parameters:**
- `active` — `true` to only show chofers updated within last 2 minutes (optional)

**Response (200):**
```json
{
  "count": 3,
  "locations": [
    {
      "choferId": "uuid",
      "latitude": -34.6037,
      "longitude": -58.3816,
      "speed": 45.2,
      "heading": 180.0,
      "timestamp": "2026-03-05T20:00:00.000Z",
      "updatedAt": "2026-03-05T20:00:05.000Z",
      "stale": false,
      "chofer": { "id": "uuid", "nombre": "Juan Perez" }
    }
  ]
}
```

**Frontend integration (Admin dashboard):**
- Poll every 10-15 seconds with `?active=true` for live map
- Use `stale: true` to gray out inactive markers

---

### GET `/locations/heatmap`
**Auth:** Bearer token | Role: `admin`

**Query Parameters (all required except where noted):**
- `fechaInicio` — Start date `YYYY-MM-DD`
- `fechaFin` — End date `YYYY-MM-DD`
- `precision` — `2` (~1.1km grid) or `3` (~110m grid). Default: `3` (optional)
- `choferId` — Filter by specific chofer UUID (optional)

**Response (200):**
```json
{
  "cellSize": "~110 m",
  "precision": 3,
  "fechaInicio": "2026-03-01",
  "fechaFin": "2026-03-05",
  "totalPoints": 1500,
  "cells": [
    { "lat": -34.604, "lng": -58.382, "count": 45, "intensity": 1.0 },
    { "lat": -34.605, "lng": -58.381, "count": 30, "intensity": 0.67 },
    { "lat": -34.610, "lng": -58.390, "count": 5, "intensity": 0.11 }
  ]
}
```

**Frontend integration:**
- Use `intensity` (0-1) as color weight for heatmap layer
- Leaflet: `L.heatLayer(cells.map(c => [c.lat, c.lng, c.intensity]))`
- Google Maps: `new google.maps.visualization.HeatmapLayer({ data: ... })`
- Max date range: 90 days

---

### GET `/locations/:choferId`
**Auth:** Bearer token | Role: `admin` or `chofer` (own data only)

**Path Parameters:**
- `choferId` — Chofer UUID

**Response (200):**
```json
{
  "location": {
    "choferId": "uuid",
    "latitude": -34.6037,
    "longitude": -58.3816,
    "speed": 45.2,
    "heading": 180.0,
    "timestamp": "2026-03-05T20:00:00.000Z",
    "stale": false,
    "chofer": { "id": "uuid", "nombre": "Juan Perez" }
  }
}
```

---

### GET `/locations/:choferId/history`
**Auth:** Bearer token | Role: `admin` or `chofer` (own data only)

**Path Parameters:**
- `choferId` — Chofer UUID

**Query Parameters:**
- `jornadaId` — Filter by jornada UUID (optional)
- `limite` — Max results, default: 100 (optional)

**Response (200):**
```json
{
  "count": 50,
  "history": [
    {
      "latitude": -34.6037,
      "longitude": -58.3816,
      "speed": 45.2,
      "heading": 180.0,
      "timestamp": "2026-03-05T20:00:00.000Z",
      "jornadaId": "uuid"
    }
  ]
}
```

**Frontend integration:**
- Draw as polyline on map for route replay
- Filter by `jornadaId` to show a specific shift's route

---

## Roles

| Role | Value |
|---|---|
| Admin | `admin` |
| Chofer | `chofer` |
| Cliente | `cliente` |

## Client Status

| Status | Value | Description |
|---|---|---|
| Disponible | `disponible` | Not assigned to any chofer |
| Asignado | `asignado` | Assigned to a chofer |
| Visitado | `visitado` | Chofer created a remito for this client |

## Error Responses

All errors follow this format:
```json
{
  "error": "Error message description"
}
```

| Status Code | Meaning |
|---|---|
| 400 | Bad request / validation error |
| 401 | Missing or invalid token |
| 403 | Insufficient permissions |
| 404 | Resource not found |
| 409 | Conflict (duplicate) |
| 500 | Server error |
