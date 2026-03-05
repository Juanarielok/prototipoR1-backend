/**
 * @swagger
 * /locations:
 *   post:
 *     summary: Update chofer location (Chofer only)
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *                 example: -34.6037
 *               longitude:
 *                 type: number
 *                 example: -58.3816
 *               speed:
 *                 type: number
 *                 example: 12.5
 *                 description: Speed in m/s (optional)
 *               heading:
 *                 type: number
 *                 example: 180.0
 *                 description: Direction in degrees (optional)
 *               jornadaId:
 *                 type: string
 *                 description: Active jornada ID (optional)
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: When location was captured on device (optional, defaults to now)
 *     responses:
 *       200:
 *         description: Location updated
 *       400:
 *         description: Invalid coordinates
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Chofer only
 */

/**
 * @swagger
 * /locations:
 *   get:
 *     summary: Get all chofer locations (Admin only)
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: Filter only active (non-stale) locations (updated within last 2 minutes)
 *     responses:
 *       200:
 *         description: List of chofer locations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 locations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       choferId:
 *                         type: string
 *                       chofer:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           nombre:
 *                             type: string
 *                           telefono:
 *                             type: string
 *                       latitude:
 *                         type: number
 *                       longitude:
 *                         type: number
 *                       speed:
 *                         type: number
 *                       heading:
 *                         type: number
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       stale:
 *                         type: boolean
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Admin only
 */

/**
 * @swagger
 * /locations/heatmap:
 *   get:
 *     summary: Get location heatmap data (Admin only)
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fechaInicio
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (e.g. 2026-01-01)
 *       - in: query
 *         name: fechaFin
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (max 90 days range)
 *       - in: query
 *         name: precision
 *         schema:
 *           type: integer
 *           enum: [2, 3]
 *           default: 3
 *         description: Decimal places for grid cells (2 = ~1.1km, 3 = ~110m)
 *       - in: query
 *         name: choferId
 *         schema:
 *           type: string
 *         description: Filter by specific chofer (optional)
 *     responses:
 *       200:
 *         description: Heatmap cell data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cellSize:
 *                   type: string
 *                   example: "~110m"
 *                 precision:
 *                   type: integer
 *                   example: 3
 *                 fechaInicio:
 *                   type: string
 *                 fechaFin:
 *                   type: string
 *                 totalPoints:
 *                   type: integer
 *                 cells:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       lat:
 *                         type: number
 *                       lng:
 *                         type: number
 *                       count:
 *                         type: integer
 *                       intensity:
 *                         type: number
 *                         description: Normalized 0-1 value (count / maxCount)
 *       400:
 *         description: Invalid parameters (missing dates, bad precision, range > 90 days)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Admin only
 */

/**
 * @swagger
 * /locations/{choferId}/history:
 *   get:
 *     summary: Get chofer location history (Admin or own Chofer)
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: choferId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: jornadaId
 *         schema:
 *           type: string
 *         description: Filter by jornada ID to get route for a specific shift
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Max number of history points to return
 *     responses:
 *       200:
 *         description: Location history points
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       latitude:
 *                         type: number
 *                       longitude:
 *                         type: number
 *                       speed:
 *                         type: number
 *                       heading:
 *                         type: number
 *                       jornadaId:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */

/**
 * @swagger
 * /locations/{choferId}:
 *   get:
 *     summary: Get a specific chofer's current location (Admin or own Chofer)
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: choferId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chofer location
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: No location found for this chofer
 */
