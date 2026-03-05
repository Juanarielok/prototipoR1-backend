import { Router } from "express";
import {
  updateLocation,
  getChoferLocation,
  getChoferHistory,
  getHeatmap,
  getAllLocations,
} from "../controllers/location.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { Role } from "../types/auth";

const router = Router();

// Chofer sends their location
router.post("/", authenticate, authorize(Role.CHOFER), updateLocation);

// Admin gets all locations (with optional ?active=true filter)
router.get("/", authenticate, authorize(Role.ADMIN), getAllLocations);

// Admin gets heatmap data (must be before /:choferId to avoid param collision)
router.get("/heatmap", authenticate, authorize(Role.ADMIN), getHeatmap);

// Admin or chofer gets location history for a chofer (with optional ?jornadaId filter)
router.get("/:choferId/history", authenticate, authorize(Role.ADMIN, Role.CHOFER), getChoferHistory);

// Admin or chofer gets a specific chofer's current location
router.get("/:choferId", authenticate, authorize(Role.ADMIN, Role.CHOFER), getChoferLocation);

export default router;
