# Driver Location Tracking - System Design

## Architecture Overview

```
+---------------------+          +-------------------------+         +------------+
|   Kotlin App        |          |   Express Backend       |         | PostgreSQL |
|   (Android)         |          |   (REST API)            |         |            |
|                     |          |                         |         |            |
|  FusedLocation      |  POST    |  POST /locations        |  UPSERT |  driver_   |
|  ProviderClient ----|--------->|  - Validate JWT         |-------->|  locations |
|  (every 20-30s)     |  /locations| - Validate coords    |         |  table     |
|                     |          |  - Upsert location      |         |            |
+---------------------+          +-------------------------+         +------------+
                                          |
                                          | GET /locations/:choferId
                                          | GET /locations (all active)
                                          v
                                 +---------------------+
                                 |   Admin Dashboard   |
                                 |   (React/Frontend)  |
                                 |                     |
                                 |   Polls every 10-15s|
                                 |   to refresh map    |
                                 +---------------------+
```

## Data Flow

```
1. CHOFER SENDS LOCATION (Kotlin App)
   +-----------+     HTTP POST /locations      +----------+
   |  Android  | ----------------------------> | Backend  |
   |  App      |  { lat, lng, timestamp,       | Express  |
   |           |    speed?, heading?,           |          |
   |           |    jornadaId? }                |          |
   +-----------+  + Authorization: Bearer JWT  +----------+
                                                    |
                                                    v
                                              +-----------+
                                              |  DB Upsert|
                                              |  (one row |
                                              |  per      |
                                              |  chofer)  |
                                              +-----------+

2. ADMIN QUERIES LOCATIONS (Dashboard)
   +-----------+     HTTP GET /locations        +----------+
   |  React    | ----------------------------> | Backend  |
   |  Admin    |  ?active=true                 | Express  |
   |  Panel    | <---------------------------- |          |
   +-----------+   [{ choferId, lat, lng,      +----------+
                      nombre, updatedAt }, ...]
```

## Database Model: DriverLocation

```
+-------------------+----------+-------------------------------------------+
| Column            | Type     | Description                               |
+-------------------+----------+-------------------------------------------+
| id                | UUID     | Primary key                               |
| choferId          | UUID     | FK -> users.id (unique, one row per user) |
| latitude          | FLOAT    | GPS latitude                              |
| longitude         | FLOAT    | GPS longitude                             |
| speed             | FLOAT?   | Speed in m/s (optional)                   |
| heading           | FLOAT?   | Direction in degrees (optional)           |
| jornadaId         | UUID?    | FK -> jornadas.id (optional)              |
| timestamp         | DATE     | When the location was captured on device  |
| createdAt         | DATE     | Row creation time                         |
| updatedAt         | DATE     | Last update time (= last known position)  |
+-------------------+----------+-------------------------------------------+
```

## API Endpoints

```
POST   /locations              -> Chofer sends current location (auth required, role: chofer)
GET    /locations/:choferId    -> Get last known location of a specific chofer (auth required)
GET    /locations              -> Get all active chofer locations (auth required, role: admin)
```

## Key Design Decisions

1. **One row per chofer (UPSERT):** We don't store history, just the latest position.
   This keeps the table small and queries fast.

2. **20-30 second interval:** Good balance between accuracy and battery consumption.
   The Kotlin app should use FusedLocationProviderClient with PRIORITY_BALANCED_POWER_ACCURACY.

3. **Stale detection:** A location is considered "stale" if updatedAt > 2 minutes ago.
   The GET endpoints can filter these out with ?active=true.

4. **No WebSockets:** REST polling is cheaper on infrastructure and battery.
   The admin dashboard polls GET /locations every 10-15 seconds.

## Security

- All endpoints require JWT authentication
- POST /locations only accepts requests from users with role "chofer"
- GET endpoints require role "admin" or "chofer" (chofer can only see own location)
- Coordinates are validated (lat: -90 to 90, lng: -180 to 180)
