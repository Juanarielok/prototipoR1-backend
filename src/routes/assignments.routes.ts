import { Router, Response } from "express";
import { Assignment, User } from "../models";
import { authenticate, authorize, AuthRequest } from "../middleware/auth.middleware";
import { Role } from "../types/auth";

const router = Router();

/**
 * Admin asigna clientes a un chofer
 * POST /assignments
 * body: { choferId: string, clientIds: string[] }
 */
router.post("/", authenticate, authorize(Role.ADMIN), async (req: AuthRequest, res: Response) => {
  const { choferId, clientIds } = req.body as { choferId?: string; clientIds?: string[] };

  if (!choferId || !Array.isArray(clientIds) || clientIds.length === 0) {
    return res.status(400).json({ error: "Falta choferId o clientIds[]" });
  }

  try {
    // Validación mínima: que el chofer exista y sea rol CHOFER
    const chofer = await User.findByPk(choferId, { attributes: ["id", "role"] });
    if (!chofer) {
      return res.status(404).json({ error: "Chofer no encontrado" });
    }
    if (chofer.role !== Role.CHOFER) {
      return res.status(400).json({ error: "El usuario indicado no es chofer" });
    }

    // Filtramos solo clientes que existan y tengan rol CLIENTE
    const users = await User.findAll({
      where: { id: clientIds },
      attributes: ["id", "role"],
    });

    const clienteIdsOk = users.filter((u: any) => u.role === Role.CLIENTE).map((u: any) => u.id);

    if (clienteIdsOk.length === 0) {
      return res.status(400).json({ error: "No se encontraron clientes válidos para asignar" });
    }

    const rows = clienteIdsOk.map((clienteId) => ({
      choferId,
      clienteId,
      status: "assigned" as const,
    }));

    await Assignment.bulkCreate(rows, { ignoreDuplicates: true });

    return res.status(201).json({
      message: "Asignados",
      count: rows.length,
      choferId,
      clientIds: clienteIdsOk,
    });
  } catch (error) {
    console.error("Assignments POST / error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Chofer trae SUS clientes asignados (para la APK)
 * GET /assignments/me
 * devuelve: { clientes: [{ id, nombre, ubicacion }] }
 */
router.get("/me", authenticate, authorize(Role.CHOFER), async (req: AuthRequest, res: Response) => {
  try {
    const choferId = req.user!.id; // authenticate setea req.user

    const asignaciones = await Assignment.findAll({
      where: { choferId, status: "assigned" },
      include: [{ model: User, as: "cliente", attributes: ["id", "nombre", "ubicacion"] }],
      order: [["createdAt", "DESC"]],
    });

    const clientes = asignaciones.map((a: any) => a.cliente).filter(Boolean);
    return res.json({ clientes });
  } catch (error) {
    console.error("Assignments GET /me error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
