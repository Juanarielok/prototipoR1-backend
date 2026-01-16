/**
 * @swagger
 * /jornadas/checkin:
 *   post:
 *     summary: Start work day (Chofer only)
 *     tags: [Jornadas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ubicacion:
 *                 type: string
 *                 example: "-34.6037, -58.3816"
 *               notas:
 *                 type: string
 *                 example: "Inicio de jornada"
 *     responses:
 *       201:
 *         description: Check-in successful
 *       400:
 *         description: Already has active shift
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Chofer only
 */

/**
 * @swagger
 * /jornadas/checkout:
 *   post:
 *     summary: End work day (Chofer only)
 *     tags: [Jornadas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ubicacion:
 *                 type: string
 *                 example: "-34.6037, -58.3816"
 *               notas:
 *                 type: string
 *                 example: "Fin de jornada"
 *     responses:
 *       200:
 *         description: Check-out successful
 *       400:
 *         description: No active shift
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Chofer only
 */

/**
 * @swagger
 * /jornadas/me:
 *   get:
 *     summary: Get current shift status (Chofer only)
 *     tags: [Jornadas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current shift info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activa:
 *                   type: boolean
 *                   example: true
 *                 jornada:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     checkIn:
 *                       type: string
 *                       format: date-time
 *                     tiempoTranscurrido:
 *                       type: object
 *                       properties:
 *                         minutos:
 *                           type: integer
 *                           example: 180
 *                         formato:
 *                           type: string
 *                           example: "3h 0m"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Chofer only
 */

/**
 * @swagger
 * /jornadas/me/historial:
 *   get:
 *     summary: Get my shift history (Chofer only)
 *     tags: [Jornadas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Shift history
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Chofer only
 */

/**
 * @swagger
 * /jornadas/activas:
 *   get:
 *     summary: Get all active shifts (Admin only)
 *     tags: [Jornadas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active shifts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 choferesActivos:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
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
 *                       checkIn:
 *                         type: string
 *                         format: date-time
 *                       tiempoTranscurrido:
 *                         type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Admin only
 */

/**
 * @swagger
 * /jornadas/chofer/{choferId}:
 *   get:
 *     summary: Get chofer shift history (Admin only)
 *     tags: [Jornadas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: choferId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           default: 30
 *       - in: query
 *         name: fechaInicio
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Chofer shift history with summary
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Admin only
 *       404:
 *         description: Chofer not found
 */