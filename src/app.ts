import 'dotenv/config';
import express, { Application, Request, Response, NextFunction } from 'express';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import { swaggerSpec, swaggerUiOptions } from './config/swagger';
import assignmentsRoutes from "./routes/assignments.routes";
import jornadaRoutes from "./routes/jornada.routes";
import remitoRoutes from "./routes/remito.routes";
import locationRoutes from "./routes/location.routes";
import cors from "cors";

const app: Application = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "https://juanariel.org"],
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

// Location routes
app.use("/locations", locationRoutes);

export default app;
