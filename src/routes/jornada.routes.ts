import { Router } from "express";
import {
  checkIn,
  checkOut,
  getMiJornada,
  getMiHistorial,
  getJornadasActivas,
  getHistorialChofer,
} from "../controllers/jornada.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { Role } from "../types/auth";

const router = Router();

// Chofer endpoints
router.post("/checkin", authenticate, authorize(Role.CHOFER), checkIn);
router.post("/checkout", authenticate, authorize(Role.CHOFER), checkOut);
router.get("/me", authenticate, authorize(Role.CHOFER), getMiJornada);
router.get("/me/historial", authenticate, authorize(Role.CHOFER), getMiHistorial);

// Admin endpoints
router.get("/activas", authenticate, authorize(Role.ADMIN), getJornadasActivas);
router.get("/chofer/:choferId", authenticate, authorize(Role.ADMIN), getHistorialChofer);

export default router;