/**
 * @swagger
 * /users/search:
 *   get:
 *     summary: Find user by ID or DNI
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID or DNI
 *         example: "12345678"
 *     responses:
 *       200:
 *         description: User found
 *       400:
 *         description: Search parameter required
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Juan Pérez
 *               dni:
 *                 type: string
 *                 example: "12345678"
 *               cuit:
 *                 type: string
 *                 example: "27-12345678-9"
 *               telefono:
 *                 type: string
 *                 example: "+54 11 1234-5678"
 *               ubicacion:
 *                 type: string
 *                 example: "Buenos Aires, Argentina"
 *               razonSocial:
 *                 type: string
 *                 example: "Empresa S.A."
 *               tipoComercio:
 *                 type: string
 *                 example: "Mayorista"
 *               notas:
 *                 type: string
 *                 example: "Cliente preferencial"
 *               foto:
 *                 type: string
 *                 example: "https://example.com/foto.jpg"
 *               role:
 *                 type: string
 *                 enum: [admin, chofer, cliente]
 *                 example: cliente
 *     responses:
 *       200:
 *         description: User updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Admin only
 *       404:
 *         description: User not found
 */