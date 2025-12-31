import express, { Application, Request, Response, NextFunction } from 'express';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './routes/auth.routes';
import { swaggerSpec } from './config/swagger';

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

// Server
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});