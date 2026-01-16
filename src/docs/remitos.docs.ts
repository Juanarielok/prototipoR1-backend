/**
 * @swagger
 * /remitos:
 *   post:
 *     summary: Create a new remito (Chofer only)
 *     tags: [Remitos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clienteId
 *               - productos
 *             properties:
 *               clienteId:
 *                 type: string
 *                 example: "6d7a9c2f-1a2b-4c3d-8e9f-0a1b2c3d4e5f"
 *               productos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     nombre:
 *                       type: string
 *                       example: "Producto A"
 *                     cantidad:
 *                       type: number
 *                       example: 2
 *                     precio:
 *                       type: number
 *                       example: 100.50
 *               notas:
 *                 type: string
 *                 example: "Entrega urgente"
 *     responses:
 *       201:
 *         description: Remito created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Chofer only
 *       404:
 *         description: Client not found
 */

/**
 * @swagger
 * /remitos/me:
 *   get:
 *     summary: Get my remitos (Chofer only)
 *     tags: [Remitos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of remitos
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Chofer only
 */

/**
 * @swagger
 * /remitos/cliente/{clienteId}:
 *   get:
 *     summary: Get remitos by client
 *     tags: [Remitos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clienteId
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID (UUID)
 *     responses:
 *       200:
 *         description: List of remitos for the client
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /remitos/{id}:
 *   get:
 *     summary: Get remito by ID
 *     tags: [Remitos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Remito ID (UUID)
 *     responses:
 *       200:
 *         description: Remito details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Remito not found
 */

/**
 * @swagger
 * /remitos/{id}/pdf:
 *   get:
 *     summary: Generate and download remito PDF
 *     tags: [Remitos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Remito ID (UUID)
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Remito not found
 */