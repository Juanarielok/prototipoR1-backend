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
 *         description: User role
 *         example: cliente
 *     responses:
 *       200:
 *         description: List of users
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