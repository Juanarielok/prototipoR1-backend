# Heatmap Data - System Design

## Overview

The heatmap feature aggregates location history points into a grid of cells,
each with a count of how many times choferes passed through that area. This
enables visual analysis of traffic density, popular routes, and coverage gaps
on the admin dashboard.

## How It Works

```
location_history table              Heatmap Aggregation              Frontend Map
(raw GPS points)                    (server-side)                    (client-side)

+---------+-----------+             +----------+-------+             +------------------+
| lat     | lng       |             | cell_lat | count |             |                  |
|---------+-----------|   GROUP BY  |----------+-------|             |   [colored       |
| -34.601 | -58.381   |  -------->  | -34.60   |   47  |  -------->  |    overlay on     |
| -34.602 | -58.382   |  rounded    | -34.61   |   23  |    JSON     |    map tiles]     |
| -34.610 | -58.390   |  coords    | -34.62   |    8  |             |                  |
| -34.601 | -58.380   |             | ...      |  ...  |             |                  |
| ...     | ...       |             +----------+-------+             +------------------+
+---------+-----------+
```

## Grid Resolution

Coordinates are rounded to a configurable precision to form grid cells:

```
Precision    Cell Size (approx)    Use Case
---------    ------------------    --------
2 decimals   ~1.1 km               City-level overview
3 decimals   ~110 m                Neighborhood detail
4 decimals   ~11 m                 Street-level (too granular for heatmap)

Default: 3 decimals (~110m cells)
```

### Rounding Example

```
Raw point: (-34.6037, -58.3816)
Precision 3: (-34.604, -58.382)  <-- this becomes the cell key

All points that round to (-34.604, -58.382) are counted together.
```

## API Endpoint

```
GET /locations/heatmap?fechaInicio=2026-01-01&fechaFin=2026-01-31&precision=3
```

### Parameters

```
+---------------+----------+---------+--------------------------------------------+
| Parameter     | Type     | Default | Description                                |
+---------------+----------+---------+--------------------------------------------+
| fechaInicio   | date     | -       | Start date (required)                      |
| fechaFin      | date     | -       | End date (required)                        |
| precision     | integer  | 3       | Decimal places for rounding (2, 3, or 4)   |
| choferId      | uuid     | all     | Filter by specific chofer (optional)       |
+---------------+----------+---------+--------------------------------------------+
```

### Response

```json
{
  "cellSize": "~110m",
  "precision": 3,
  "fechaInicio": "2026-01-01",
  "fechaFin": "2026-01-31",
  "totalPoints": 15420,
  "cells": [
    { "lat": -34.604, "lng": -58.382, "count": 47, "intensity": 1.0 },
    { "lat": -34.610, "lng": -58.390, "count": 23, "intensity": 0.49 },
    { "lat": -34.620, "lng": -58.400, "count": 8,  "intensity": 0.17 },
    ...
  ]
}
```

- `intensity`: normalized 0-1 value (count / maxCount), for easy color mapping on frontend

## Data Flow

```
+-------------------+
| Admin Dashboard   |
| GET /locations/   |
|     heatmap       |
+--------+----------+
         |
         | ?fechaInicio=X&fechaFin=Y&precision=3
         v
+--------+----------+
| Express Backend   |
|                   |
| 1. Validate dates |
| 2. Query          |
|    location_      |
|    history        |
| 3. Round coords   |
| 4. Group & count  |
| 5. Normalize      |
|    intensity      |
+--------+----------+
         |
         | SELECT ROUND(latitude, 3), ROUND(longitude, 3), COUNT(*)
         | FROM location_history
         | WHERE timestamp BETWEEN ? AND ?
         | GROUP BY 1, 2
         | ORDER BY count DESC
         v
+--------+----------+
|   PostgreSQL      |
|   location_       |
|   history table   |
+-------------------+
```

## Implementation Strategy

### Option A: Database-side aggregation (recommended)

Use SQL `ROUND()` and `GROUP BY` to do all aggregation in PostgreSQL.
This is efficient because:
- No need to transfer thousands of raw points to Node.js
- PostgreSQL handles the math natively
- Works well up to millions of rows with proper indexes

```sql
SELECT
  ROUND(latitude::numeric, :precision) AS lat,
  ROUND(longitude::numeric, :precision) AS lng,
  COUNT(*) AS count
FROM location_history
WHERE timestamp BETWEEN :fechaInicio AND :fechaFin
GROUP BY lat, lng
ORDER BY count DESC;
```

### Option B: Application-side aggregation (fallback for SQLite tests)

For the SQLite test database (which has different ROUND behavior),
aggregate in JavaScript using a Map with rounded coordinate keys.

The controller should use Option A for production and Option B as fallback.

## Security

- Admin-only endpoint (role: admin)
- Requires JWT authentication
- Date range is required to prevent unbounded queries
- Consider adding a max date range (e.g., 90 days) to prevent slow queries

## Performance Considerations

```
Scenario               Rows        Response Time (est.)
--------               ----        --------------------
1 chofer, 1 day        ~2,880      < 50ms
All choferes, 1 week   ~100,000    < 200ms
All choferes, 1 month  ~400,000    < 500ms
All choferes, 1 year   ~5,000,000  1-3s (consider caching)
```

- Index on `(timestamp)` is critical for date range queries
- For large datasets, consider materializing daily aggregates in a cache table
- The precision parameter naturally limits response size:
  - Precision 2: max ~10,000 cells (1.1km grid)
  - Precision 3: max ~1,000,000 cells (110m grid, but most will be empty)

## Frontend Integration Notes

The response format is designed to work directly with common map heatmap
libraries:

- **Leaflet.heat**: expects `[[lat, lng, intensity], ...]`
- **Google Maps HeatmapLayer**: expects `[{location: LatLng, weight: count}, ...]`
- **Mapbox GL heatmap layer**: expects GeoJSON FeatureCollection

The `intensity` field (0-1) can be used directly for color mapping.
