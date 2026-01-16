/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - role
 *               - nombre
 *               - dni
 *               - cuit
 *               - telefono
 *               - ubicacion
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: cliente@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: mypassword123
 *               role:
 *                 type: string
 *                 enum: [admin, chofer, cliente]
 *                 example: cliente
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
 *               usuario:
 *                 type: string
 *                 example: "jperez"
 *               codigoArea:
 *                 type: string
 *                 example: "011"
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Admin only
 *       409:
 *         description: User already exists
 */

/**
 * @swagger
 * /users/search:
 *   get:
 *     summary: Find user by ID, DNI, or Email
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (UUID), DNI, or Email
 *         examples:
 *           byDni:
 *             summary: Search by DNI
 *             value: "12345678"
 *           byEmail:
 *             summary: Search by Email
 *             value: "cliente@example.com"
 *           byId:
 *             summary: Search by UUID
 *             value: "1b8f2d2c-5c3a-4b7f-9c4c-2f5d0f1d2a3b"
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "1b8f2d2c-5c3a-4b7f-9c4c-2f5d0f1d2a3b"
 *                     email:
 *                       type: string
 *                       example: "cliente@example.com"
 *                     role:
 *                       type: string
 *                       example: "cliente"
 *                     nombre:
 *                       type: string
 *                       example: "Juan Pérez"
 *                     dni:
 *                       type: string
 *                       example: "12345678"
 *                     cuit:
 *                       type: string
 *                       example: "27-12345678-9"
 *                     telefono:
 *                       type: string
 *                       example: "+54 11 1234-5678"
 *                     ubicacion:
 *                       type: string
 *                       example: "Buenos Aires, Argentina"
 *                     usuario:
 *                       type: string
 *                       example: "jperez"
 *                     codigoArea:
 *                       type: string
 *                       example: "011"
 *       400:
 *         description: Search parameter required
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /users/role/{role}:
 *   get:
 *     summary: List all users by role
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [admin, chofer, cliente]
 *         description: User role to filter by
 *         example: cliente
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "1b8f2d2c-5c3a-4b7f-9c4c-2f5d0f1d2a3b"
 *                       email:
 *                         type: string
 *                         example: "cliente@example.com"
 *                       role:
 *                         type: string
 *                         example: "cliente"
 *                       nombre:
 *                         type: string
 *                         example: "Juan Pérez"
 *                       usuario:
 *                         type: string
 *                         example: "jperez"
 *                       codigoArea:
 *                         type: string
 *                         example: "011"
 *       400:
 *         description: Invalid role
 *       401:
 *         description: Unauthorized
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
 *         description: User ID (UUID)
 *         example: "1b8f2d2c-5c3a-4b7f-9c4c-2f5d0f1d2a3b"
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
 *               usuario:
 *                 type: string
 *                 example: "jperez"
 *               codigoArea:
 *                 type: string
 *                 example: "011"
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

/**
 * @swagger
 * /users/{id}/reset-password:
 *   put:
 *     summary: Reset user password (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (UUID)
 *         example: "1b8f2d2c-5c3a-4b7f-9c4c-2f5d0f1d2a3b"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: New password (minimum 6 characters)
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password reset successfully"
 *                 userId:
 *                   type: string
 *                   example: "1b8f2d2c-5c3a-4b7f-9c4c-2f5d0f1d2a3b"
 *                 email:
 *                   type: string
 *                   example: "cliente@example.com"
 *       400:
 *         description: Validation error (missing password or too short)
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       403:
 *         description: Access denied - Admin only
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /users/{id}/reset-status:
 *   patch:
 *     summary: Reset client status to "disponible" (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID (UUID)
 *         example: "1b8f2d2c-5c3a-4b7f-9c4c-2f5d0f1d2a3b"
 *     responses:
 *       200:
 *         description: Client status reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cliente disponible nuevamente"
 *                 userId:
 *                   type: string
 *                   example: "1b8f2d2c-5c3a-4b7f-9c4c-2f5d0f1d2a3b"
 *                 status:
 *                   type: string
 *                   example: "disponible"
 *       400:
 *         description: User is not a client
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Admin only
 *       404:
 *         description: User not found
 */