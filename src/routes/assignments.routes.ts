import { Router } from "express";
import { Assignment, User } from "../models";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

/**
 * Admin asigna clientes a un chofer
 * POST /assignments
 * body: { choferId: string, clientIds: string[] }
 */
router.post("/", authenticate, authorize("admin"), async (req, res) => {
  const { choferId, clientIds } = req.body as { choferId: string; clientIds: string[] };

  if (!choferId || !Array.isArray(clientIds) || clientIds.length === 0) {
    return res.status(400).json({ error: "Falta choferId o clientIds[]" });
  }

  const rows = clientIds.map((clienteId) => ({
    choferId,
    clienteId,
    status: "assigned" as const,
  }));

  await Assignment.bulkCreate(rows, { ignoreDuplicates: true });

  return res.status(201).json({ message: "Asignados", count: rows.length });
});

/**
 * Chofer trae SUS clientes asignados (para la APK)
 * GET /assignments/me
 * devuelve: { clientes: [{ id, nombre, ubicacion }] }
 */
router.get("/me", authenticate, authorize("chofer"), async (req: any, res) => {
  const choferId = req.user.id; // <- tu middleware setea req.user

  const asignaciones = await Assignment.findAll({
    where: { choferId, status: "assigned" },
    include: [{ model: User, as: "cliente", attributes: ["id", "nombre", "ubicacion"] }],
    order: [["createdAt", "DESC"]],
  });

  const clientes = asignaciones.map((a: any) => a.cliente).filter(Boolean);
  return res.json({ clientes });
});

export default router;
