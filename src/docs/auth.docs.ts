/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register first admin (only works if no admin exists)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - nombre
 *               - dni
 *               - cuit
 *               - telefono
 *               - ubicacion
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@test.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: admin123
 *               nombre:
 *                 type: string
 *                 example: Admin Principal
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
 *                 example: "Administrador principal"
 *               foto:
 *                 type: string
 *                 example: "https://example.com/foto.jpg"
 *     responses:
 *       201:
 *         description: Admin registered successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Admin already exists
 *       409:
 *         description: User already exists
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@test.com
 *               password:
 *                 type: string
 *                 example: admin123
 *           examples:
 *             Admin:
 *               summary: Login como Admin
 *               value:
 *                 email: admin@test.com
 *                 password: admin123
 *             Chofer 1:
 *               summary: Login como Chofer 1
 *               value:
 *                 email: chofer1@test.com
 *                 password: admin123
 *             Chofer 2:
 *               summary: Login como Chofer 2
 *               value:
 *                 email: chofer2@test.com
 *                 password: admin123
 *             Cliente 1:
 *               summary: Login como Cliente 1
 *               value:
 *                 email: cliente1@test.com
 *                 password: admin123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authenticated user data
 *       401:
 *         description: Unauthorized
 */