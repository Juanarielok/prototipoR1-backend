import { Response } from "express";
import { Op } from "sequelize";
import { Jornada, User } from "../models";
import { Role } from "../types/auth";
import { AuthRequest } from "../middleware/auth.middleware";

export const checkIn = async (req: AuthRequest, res: Response): Promise<void> => {
  const choferId = req.user!.id;
  const { ubicacion, notas } = req.body;

  try {
    // Verificar si ya tiene una jornada activa (sin checkOut)
    const jornadaActiva = await Jornada.findOne({
      where: { choferId, checkOut: null },
    });

    if (jornadaActiva) {
      res.status(400).json({ 
        error: "Ya tenés una jornada activa. Hacé check-out primero.",
        jornada: jornadaActiva,
      });
      return;
    }

    const jornada = await Jornada.create({
      choferId,
      checkIn: new Date(),
      ubicacionCheckIn: ubicacion || null,
      notas: notas || null,
    });

    res.status(201).json({
      message: "Check-in exitoso",
      jornada: {
        id: jornada.id,
        choferId: jornada.choferId,
        checkIn: jornada.checkIn,
        ubicacionCheckIn: jornada.ubicacionCheckIn,
        notas: jornada.notas,
      },
    });
  } catch (error) {
    console.error("Check-in error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const checkOut = async (req: AuthRequest, res: Response): Promise<void> => {
  const choferId = req.user!.id;
  const { ubicacion, notas } = req.body;

  try {
    // Buscar jornada activa
    const jornada = await Jornada.findOne({
      where: { choferId, checkOut: null },
    });

    if (!jornada) {
      res.status(400).json({ error: "No tenés una jornada activa. Hacé check-in primero." });
      return;
    }

    const checkOutTime = new Date();

    await jornada.update({
      checkOut: checkOutTime,
      ubicacionCheckOut: ubicacion || null,
      notas: notas ? `${jornada.notas || ""}\n${notas}`.trim() : jornada.notas,
    });

    // Calcular duración
    const duracionMs = checkOutTime.getTime() - new Date(jornada.checkIn).getTime();
    const duracionMinutos = Math.round(duracionMs / 60000);
    const horas = Math.floor(duracionMinutos / 60);
    const minutos = duracionMinutos % 60;

    res.json({
      message: "Check-out exitoso",
      jornada: {
        id: jornada.id,
        choferId: jornada.choferId,
        checkIn: jornada.checkIn,
        checkOut: jornada.checkOut,
        ubicacionCheckIn: jornada.ubicacionCheckIn,
        ubicacionCheckOut: jornada.ubicacionCheckOut,
        notas: jornada.notas,
        duracion: {
          minutos: duracionMinutos,
          formato: `${horas}h ${minutos}m`,
        },
      },
    });
  } catch (error) {
    console.error("Check-out error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMiJornada = async (req: AuthRequest, res: Response): Promise<void> => {
  const choferId = req.user!.id;

  try {
    const jornada = await Jornada.findOne({
      where: { choferId, checkOut: null },
    });

    if (!jornada) {
      res.json({ activa: false, jornada: null });
      return;
    }

    // Calcular tiempo transcurrido
    const ahora = new Date();
    const duracionMs = ahora.getTime() - new Date(jornada.checkIn).getTime();
    const duracionMinutos = Math.round(duracionMs / 60000);
    const horas = Math.floor(duracionMinutos / 60);
    const minutos = duracionMinutos % 60;

    res.json({
      activa: true,
      jornada: {
        id: jornada.id,
        checkIn: jornada.checkIn,
        ubicacionCheckIn: jornada.ubicacionCheckIn,
        notas: jornada.notas,
        tiempoTranscurrido: {
          minutos: duracionMinutos,
          formato: `${horas}h ${minutos}m`,
        },
      },
    });
  } catch (error) {
    console.error("Get mi jornada error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMiHistorial = async (req: AuthRequest, res: Response): Promise<void> => {
  const choferId = req.user!.id;
  const { limite = 30 } = req.query;

  try {
    const jornadas = await Jornada.findAll({
      where: { choferId },
      order: [["checkIn", "DESC"]],
      limit: Number(limite),
    });

    const jornadasConDuracion = jornadas.map((j) => {
      let duracion = null;
      if (j.checkOut) {
        const duracionMs = new Date(j.checkOut).getTime() - new Date(j.checkIn).getTime();
        const duracionMinutos = Math.round(duracionMs / 60000);
        const horas = Math.floor(duracionMinutos / 60);
        const minutos = duracionMinutos % 60;
        duracion = { minutos: duracionMinutos, formato: `${horas}h ${minutos}m` };
      }

      return {
        id: j.id,
        checkIn: j.checkIn,
        checkOut: j.checkOut,
        ubicacionCheckIn: j.ubicacionCheckIn,
        ubicacionCheckOut: j.ubicacionCheckOut,
        notas: j.notas,
        duracion,
      };
    });

    res.json({
      count: jornadas.length,
      jornadas: jornadasConDuracion,
    });
  } catch (error) {
    console.error("Get mi historial error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getJornadasActivas = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jornadas = await Jornada.findAll({
      where: { checkOut: null },
      include: [
        { model: User, as: "chofer", attributes: ["id", "nombre", "telefono"] },
      ],
      order: [["checkIn", "ASC"]],
    });

    const jornadasConTiempo = jornadas.map((j) => {
      const ahora = new Date();
      const duracionMs = ahora.getTime() - new Date(j.checkIn).getTime();
      const duracionMinutos = Math.round(duracionMs / 60000);
      const horas = Math.floor(duracionMinutos / 60);
      const minutos = duracionMinutos % 60;

      return {
        id: j.id,
        chofer: (j as any).chofer,
        checkIn: j.checkIn,
        ubicacionCheckIn: j.ubicacionCheckIn,
        tiempoTranscurrido: {
          minutos: duracionMinutos,
          formato: `${horas}h ${minutos}m`,
        },
      };
    });

    res.json({
      count: jornadas.length,
      choferesActivos: jornadasConTiempo,
    });
  } catch (error) {
    console.error("Get jornadas activas error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getHistorialChofer = async (req: AuthRequest, res: Response): Promise<void> => {
  const { choferId } = req.params;
  const { limite = 30, fechaInicio, fechaFin } = req.query;

  try {
    const chofer = await User.findByPk(choferId);
    if (!chofer || chofer.role !== Role.CHOFER) {
      res.status(404).json({ error: "Chofer no encontrado" });
      return;
    }

    const whereClause: any = { choferId };

    if (fechaInicio && fechaFin) {
      whereClause.checkIn = {
        [Op.between]: [new Date(fechaInicio as string), new Date(fechaFin as string)],
      };
    }

    const jornadas = await Jornada.findAll({
      where: whereClause,
      order: [["checkIn", "DESC"]],
      limit: Number(limite),
    });

    const jornadasConDuracion = jornadas.map((j) => {
      let duracion = null;
      if (j.checkOut) {
        const duracionMs = new Date(j.checkOut).getTime() - new Date(j.checkIn).getTime();
        const duracionMinutos = Math.round(duracionMs / 60000);
        const horas = Math.floor(duracionMinutos / 60);
        const minutos = duracionMinutos % 60;
        duracion = { minutos: duracionMinutos, formato: `${horas}h ${minutos}m` };
      }

      return {
        id: j.id,
        checkIn: j.checkIn,
        checkOut: j.checkOut,
        ubicacionCheckIn: j.ubicacionCheckIn,
        ubicacionCheckOut: j.ubicacionCheckOut,
        notas: j.notas,
        duracion,
      };
    });

    // Calcular totales
    const jornadasCompletadas = jornadas.filter((j) => j.checkOut);
    const totalMinutos = jornadasCompletadas.reduce((sum, j) => {
      const duracionMs = new Date(j.checkOut!).getTime() - new Date(j.checkIn).getTime();
      return sum + Math.round(duracionMs / 60000);
    }, 0);

    const totalHoras = Math.floor(totalMinutos / 60);
    const totalMins = totalMinutos % 60;

    res.json({
      chofer: {
        id: chofer.id,
        nombre: chofer.nombre,
      },
      resumen: {
        totalJornadas: jornadas.length,
        jornadasCompletadas: jornadasCompletadas.length,
        tiempoTotal: {
          minutos: totalMinutos,
          formato: `${totalHoras}h ${totalMins}m`,
        },
      },
      jornadas: jornadasConDuracion,
    });
  } catch (error) {
    console.error("Get historial chofer error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};