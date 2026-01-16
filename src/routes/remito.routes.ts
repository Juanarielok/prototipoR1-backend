import { Router } from "express";
import { createRemito, getRemito, getRemitosByCliente, getMyRemitos, generatePDF } from "../controllers/remito.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { Role } from "../types/auth";

const router = Router();

router.post("/", authenticate, authorize(Role.CHOFER), createRemito);
router.get("/me", authenticate, authorize(Role.CHOFER), getMyRemitos);
router.get("/cliente/:clienteId", authenticate, getRemitosByCliente);
router.get("/:id", authenticate, getRemito);
router.get("/:id/pdf", authenticate, generatePDF);

export default router;