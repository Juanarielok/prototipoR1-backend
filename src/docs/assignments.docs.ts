/**
 * @swagger
 * /assignments:
 *   post:
 *     summary: Assign one or more clients to a chofer (Admin only)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - choferId
 *               - clientIds
 *             properties:
 *               choferId:
 *                 type: string
 *                 description: Chofer user ID (UUID)
 *                 example: "1b8f2d2c-5c3a-4b7f-9c4c-2f5d0f1d2a3b"
 *               clientIds:
 *                 type: array
 *                 description: Array of client user IDs
 *                 items:
 *                   type: string
 *                   example: "6d7a9c2f-1a2b-4c3d-8e9f-0a1b2c3d4e5f"
 *     responses:
 *       201:
 *         description: Clients assigned successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Admin only
 *       404:
 *         description: Chofer not found
 */

/**
 * @swagger
 * /assignments/me/count:
 *   get:
 *     summary: Get total count of assigned clients (Chofer only)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total count of assigned clients
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 15
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Chofer only
 */

/**
 * @swagger
 * /assignments/me:
 *   get:
 *     summary: Get my assigned clients (Chofer only)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of assigned clients
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clientes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "6d7a9c2f-1a2b-4c3d-8e9f-0a1b2c3d4e5f"
 *                       nombre:
 *                         type: string
 *                         example: "Cliente Ejemplo"
 *                       ubicacion:
 *                         type: string
 *                         example: "Av. Siempre Viva 742, Mar del Plata"
 *                       status:
 *                         type: string
 *                         example: "asignado"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Chofer only
 */