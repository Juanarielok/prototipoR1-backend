# Location History - System Design

## Overview

The location history system extends the real-time location tracking by storing
every position update in an append-only table. This enables route replay,
distance analytics, and per-jornada route visualization.

## Architecture

```
+---------------------+          +---------------------------+         +------------------+
|   Kotlin App        |          |   Express Backend         |         |   PostgreSQL     |
|   (Android)         |          |   POST /locations         |         |                  |
|                     |  POST    |                           |         |                  |
|  GPS every 20-30s   |--------->|  1. Validate coords       |         |                  |
|  { lat, lng, ...}   |          |  2. Auto-link jornadaId   |-------->| driver_locations |
|                     |          |  3. UPSERT current loc    |         | (1 row/chofer)   |
|                     |          |  4. INSERT history row    |-------->| location_history |
+---------------------+          +---------------------------+         | (N rows/chofer)  |
                                                                      +------------------+
```

## Dual-Write Strategy

Each `POST /locations` performs two writes:

```
                    POST /locations
                         |
                         v
              +---------------------+
              | Validate & resolve  |
              | jornadaId           |
              +---------------------+
                    |          |
                    v          v
          +------------+  +----------------+
          | UPSERT     |  | INSERT         |
          | driver_    |  | location_      |
          | locations  |  | history        |
          | (latest)   |  | (append-only)  |
          +------------+  +----------------+
               |                  |
               v                  v
          "Where is the     "Where has the
           chofer NOW?"      chofer BEEN?"
```

## Auto-Link Jornada

When the Kotlin app sends a location without `jornadaId`, the backend
automatically finds the chofer's active jornada (checkOut = null) and
links it:

```
POST /locations { lat: -34.60, lng: -58.38 }
                         |
                         v
              jornadaId provided?
              /                  \
           YES                    NO
            |                      |
            v                      v
     use provided          SELECT FROM jornadas
                           WHERE choferId = ?
                           AND checkOut IS NULL
                                   |
                                   v
                           found? --> use jornada.id
                           not found? --> jornadaId = null
```

## Database Models

### driver_locations (current position - 1 row per chofer)

```
+-------------------+----------+-------------------------------------------+
| Column            | Type     | Notes                                     |
+-------------------+----------+-------------------------------------------+
| id                | UUID     | PK                                        |
| choferId          | UUID     | FK -> users.id, UNIQUE                    |
| latitude          | FLOAT    |                                           |
| longitude         | FLOAT    |                                           |
| speed             | FLOAT?   | m/s                                       |
| heading           | FLOAT?   | degrees                                   |
| jornadaId         | UUID?    | FK -> jornadas.id                         |
| timestamp         | DATE     | device capture time                       |
| createdAt         | DATE     |                                           |
| updatedAt         | DATE     | = last known time                         |
+-------------------+----------+-------------------------------------------+
```

### location_history (all positions - append-only)

```
+-------------------+----------+-------------------------------------------+
| Column            | Type     | Notes                                     |
+-------------------+----------+-------------------------------------------+
| id                | UUID     | PK                                        |
| choferId          | UUID     | FK -> users.id (indexed)                  |
| latitude          | FLOAT    |                                           |
| longitude         | FLOAT    |                                           |
| speed             | FLOAT?   | m/s                                       |
| heading           | FLOAT?   | degrees                                   |
| jornadaId         | UUID?    | FK -> jornadas.id (indexed)               |
| timestamp         | DATE     | device capture time                       |
| createdAt         | DATE     | server receive time                       |
+-------------------+----------+-------------------------------------------+
  * No updatedAt column (append-only, rows are never modified)
```

## API Endpoints

```
+--------+-----------------------------------+----------+----------------------------------+
| Method | Route                             | Role     | Description                      |
+--------+-----------------------------------+----------+----------------------------------+
| POST   | /locations                        | chofer   | Send current location            |
|        |                                   |          | (writes to both tables)          |
+--------+-----------------------------------+----------+----------------------------------+
| GET    | /locations                        | admin    | All current locations            |
|        |                                   |          | (?active=true for non-stale)     |
+--------+-----------------------------------+----------+----------------------------------+
| GET    | /locations/:choferId              | admin,   | Current location of one chofer   |
|        |                                   | chofer*  |                                  |
+--------+-----------------------------------+----------+----------------------------------+
| GET    | /locations/:choferId/history      | admin,   | Location history                 |
|        |                                   | chofer*  | (?jornadaId, ?limite)            |
+--------+-----------------------------------+----------+----------------------------------+
  * chofer can only access their own data
```

## Query Patterns

### 1. "Show me the route for jornada X"

```
GET /locations/:choferId/history?jornadaId=<uuid>

--> Returns ordered list of lat/lng points
--> Frontend draws polyline on map
```

### 2. "Where are all active choferes right now?"

```
GET /locations?active=true

--> Returns only locations updated within last 2 minutes
--> Frontend places markers on map, polls every 10-15s
```

### 3. "Show me the last 50 positions of chofer Y"

```
GET /locations/:choferId/history?limite=50

--> Returns most recent 50 history points (DESC by timestamp)
```

## Data Flow Diagram (Full System)

```
+------------------+
| Kotlin App       |
| (Chofer device)  |
+--------+---------+
         |
         | POST /locations (every 20-30s)
         | { lat, lng, speed, heading }
         | + Authorization: Bearer <JWT>
         |
         v
+--------+---------+       +-------------------+
| Express Backend  |       |                   |
|                  |       |    PostgreSQL      |
| 1. Auth (JWT)    |       |                   |
| 2. Validate      |       | driver_locations  |<-- UPSERT (latest)
| 3. Resolve       |------>| location_history  |<-- INSERT (append)
|    jornadaId     |       | jornadas          |<-- READ (active?)
| 4. Dual write    |       | users             |
|                  |       |                   |
+--------+---------+       +-------------------+
         ^
         |
         | GET /locations (poll every 10-15s)
         | GET /locations/:id/history
         |
+--------+---------+
| Admin Dashboard  |
| (React app)      |
|                  |
| - Live map       |
| - Route replay   |
+------------------+
```

## Growth Considerations

The location_history table grows continuously. For production, consider:

- **Partitioning by month** (PostgreSQL native partitions)
- **Retention policy** (archive/delete records older than N months)
- **Composite index** on (choferId, jornadaId, timestamp) for fast queries
- **Batch inserts** if the Kotlin app sends queued locations after reconnecting
