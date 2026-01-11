import 'dotenv/config';
import express, { Application, Request, Response, NextFunction } from 'express';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import { swaggerSpec } from './config/swagger';
import { sequelize } from './models';

const app: Application = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Server is running 🚀' });
});

app.post('/test', (req: Request, res: Response) => {
  res.status(200).json({ receivedBody: req.body });
});

// Swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Auth routes
app.use('/auth', authRoutes);

// User routes
app.use('/users', userRoutes);

// Database connection and server start
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');

    await sequelize.sync({ alter: true });
    console.log('Models synchronized');

    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
      console.log(`API Docs available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Unable to connect to database:', error);
    process.exit(1);
  }
};

startServer();