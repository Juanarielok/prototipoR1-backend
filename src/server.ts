import 'dotenv/config';
import express, { Application, Request, Response, NextFunction } from 'express';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import { swaggerSpec, swaggerUiOptions } from './config/swagger';
import { sequelize } from './models';
import assignmentsRoutes from "./routes/assignments.routes";
import jornadaRoutes from "./routes/jornada.routes";
import remitoRoutes from "./routes/remito.routes";
import cors from "cors";
const app: Application = express();
const PORT = parseInt(process.env.PORT || "3000", 10);


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Routes
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "Server is running 🚀" });
});

app.post("/test", (req: Request, res: Response) => {
  res.status(200).json({ receivedBody: req.body });
});

// Swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Auth routes
app.use("/auth", authRoutes);

// User routes
app.use("/users", userRoutes);

// Assignments routes
app.use("/assignments", assignmentsRoutes);

// Remito routes
app.use("/remitos", remitoRoutes);

// Jornada routes
app.use("/jornadas", jornadaRoutes);

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