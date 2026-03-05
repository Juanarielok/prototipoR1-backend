import { Response } from "express";
import { Op, QueryTypes } from "sequelize";
import { sequelize, DriverLocation, LocationHistory, User, Jornada } from "../models";
import { Role } from "../types/auth";
import { AuthRequest } from "../middleware/auth.middleware";

const STALE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

export const updateLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  const choferId = req.user!.id;
  const { latitude, longitude, speed, heading, jornadaId, timestamp } = req.body;

  if (latitude == null || longitude == null) {
    res.status(400).json({ error: "latitude y longitude son requeridos" });
    return;
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    res.status(400).json({ error: "Coordenadas fuera de rango" });
    return;
  }

  try {
    // Auto-link to active jornada if not provided
    let resolvedJornadaId = jornadaId ?? null;
    if (!resolvedJornadaId) {
      const activeJornada = await Jornada.findOne({
        where: { choferId, checkOut: null },
        attributes: ["id"],
      });
      if (activeJornada) resolvedJornadaId = activeJornada.id;
    }

    const locationTimestamp = timestamp ? new Date(timestamp) : new Date();

    const [location] = await DriverLocation.upsert({
      choferId,
      latitude,
      longitude,
      speed: speed ?? null,
      heading: heading ?? null,
      jornadaId: resolvedJornadaId,
      timestamp: locationTimestamp,
    });

    // Save to history
    await LocationHistory.create({
      choferId,
      latitude,
      longitude,
      speed: speed ?? null,
      heading: heading ?? null,
      jornadaId: resolvedJornadaId,
      timestamp: locationTimestamp,
    });

    res.json({
      message: "Ubicacion actualizada",
      location: {
        choferId: location.choferId,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp,
      },
    });
  } catch (error) {
    console.error("Update location error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getChoferLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  const { choferId } = req.params;
  const requestingUser = req.user!;

  // Chofers can only see their own location
  if (requestingUser.role === Role.CHOFER && requestingUser.id !== choferId) {
    res.status(403).json({ error: "Solo podes ver tu propia ubicacion" });
    return;
  }

  try {
    const location = await DriverLocation.findOne({
      where: { choferId },
      include: [{ model: User, as: "chofer", attributes: ["id", "nombre", "telefono"] }],
    });

    if (!location) {
      res.status(404).json({ error: "No se encontro ubicacion para este chofer" });
      return;
    }

    const isStale = Date.now() - new Date(location.updatedAt).getTime() > STALE_THRESHOLD_MS;

    res.json({
      location: {
        choferId: location.choferId,
        chofer: (location as any).chofer,
        latitude: location.latitude,
        longitude: location.longitude,
        speed: location.speed,
        heading: location.heading,
        timestamp: location.timestamp,
        updatedAt: location.updatedAt,
        stale: isStale,
      },
    });
  } catch (error) {
    console.error("Get chofer location error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getChoferHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  const { choferId } = req.params;
  const { jornadaId, limite = 100 } = req.query;
  const requestingUser = req.user!;

  if (requestingUser.role === Role.CHOFER && requestingUser.id !== choferId) {
    res.status(403).json({ error: "Solo podes ver tu propio historial de ubicaciones" });
    return;
  }

  try {
    const whereClause: any = { choferId };
    if (jornadaId) whereClause.jornadaId = jornadaId;

    const history = await LocationHistory.findAll({
      where: whereClause,
      order: [["timestamp", "DESC"]],
      limit: Number(limite),
    });

    res.json({
      count: history.length,
      history: history.map((h) => ({
        latitude: h.latitude,
        longitude: h.longitude,
        speed: h.speed,
        heading: h.heading,
        jornadaId: h.jornadaId,
        timestamp: h.timestamp,
      })),
    });
  } catch (error) {
    console.error("Get chofer history error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const MAX_HEATMAP_DAYS = 90;
const ALLOWED_PRECISIONS = [2, 3];
const CELL_SIZE_LABELS: Record<number, string> = { 2: "~1.1km", 3: "~110m" };

export const getHeatmap = async (req: AuthRequest, res: Response): Promise<void> => {
  const { fechaInicio, fechaFin, precision: precisionStr = "3", choferId } = req.query;

  if (!fechaInicio || !fechaFin) {
    res.status(400).json({ error: "fechaInicio y fechaFin son requeridos" });
    return;
  }

  const start = new Date(fechaInicio as string + "T00:00:00.000Z");
  const end = new Date(fechaFin as string + "T23:59:59.999Z");

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    res.status(400).json({ error: "Fechas invalidas" });
    return;
  }

  const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0 || diffDays > MAX_HEATMAP_DAYS) {
    res.status(400).json({ error: `El rango maximo es de ${MAX_HEATMAP_DAYS} dias` });
    return;
  }

  const precision = Number(precisionStr);
  if (!ALLOWED_PRECISIONS.includes(precision)) {
    res.status(400).json({ error: `precision debe ser uno de: ${ALLOWED_PRECISIONS.join(", ")}` });
    return;
  }

  try {
    let query = `
      SELECT
        ROUND(latitude, :precision) AS lat,
        ROUND(longitude, :precision) AS lng,
        COUNT(*) AS count
      FROM location_history
      WHERE "timestamp" BETWEEN :fechaInicio AND :fechaFin
    `;
    // Format dates to match Sequelize's SQLite storage format (YYYY-MM-DD HH:MM:SS.mmm +00:00)
    const formatDate = (d: Date) => {
      const pad = (n: number, w = 2) => String(n).padStart(w, "0");
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.${pad(d.getUTCMilliseconds(), 3)} +00:00`;
    };

    const replacements: any = {
      precision,
      fechaInicio: formatDate(start),
      fechaFin: formatDate(end),
    };

    if (choferId) {
      query += ` AND "choferId" = :choferId`;
      replacements.choferId = choferId;
    }

    query += `
      GROUP BY ROUND(latitude, :precision), ROUND(longitude, :precision)
      ORDER BY count DESC
    `;

    const cells = await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    }) as Array<{ lat: number; lng: number; count: string | number }>;

    const maxCount = cells.length > 0 ? Number(cells[0].count) : 0;

    res.json({
      cellSize: CELL_SIZE_LABELS[precision],
      precision,
      fechaInicio: fechaInicio as string,
      fechaFin: fechaFin as string,
      totalPoints: cells.reduce((sum, c) => sum + Number(c.count), 0),
      cells: cells.map((c) => ({
        lat: Number(c.lat),
        lng: Number(c.lng),
        count: Number(c.count),
        intensity: maxCount > 0 ? Number(c.count) / maxCount : 0,
      })),
    });
  } catch (error) {
    console.error("Get heatmap error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllLocations = async (req: AuthRequest, res: Response): Promise<void> => {
  const { active } = req.query;

  try {
    const whereClause: any = {};

    if (active === "true") {
      whereClause.updatedAt = {
        [Op.gte]: new Date(Date.now() - STALE_THRESHOLD_MS),
      };
    }

    const locations = await DriverLocation.findAll({
      where: whereClause,
      include: [{ model: User, as: "chofer", attributes: ["id", "nombre", "telefono"] }],
      order: [["updatedAt", "DESC"]],
    });

    res.json({
      count: locations.length,
      locations: locations.map((loc) => ({
        choferId: loc.choferId,
        chofer: (loc as any).chofer,
        latitude: loc.latitude,
        longitude: loc.longitude,
        speed: loc.speed,
        heading: loc.heading,
        timestamp: loc.timestamp,
        updatedAt: loc.updatedAt,
        stale: Date.now() - new Date(loc.updatedAt).getTime() > STALE_THRESHOLD_MS,
      })),
    });
  } catch (error) {
    console.error("Get all locations error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
