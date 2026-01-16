import { Response } from "express";
import { Remito, User, Assignment } from "../models";
import { Role, ClientStatus } from "../types/auth";
import { AuthRequest } from "../middleware/auth.middleware";
import PDFDocument from "pdfkit";

export const createRemito = async (req: AuthRequest, res: Response): Promise<void> => {
  const choferId = req.user!.id;
  const { clienteId, productos, notas } = req.body;

  if (!clienteId || !productos || !Array.isArray(productos) || productos.length === 0) {
    res.status(400).json({ error: "clienteId y productos[] son requeridos" });
    return;
  }

  try {
    // Validar que el cliente existe
    const cliente = await User.findByPk(clienteId);
    if (!cliente || cliente.role !== Role.CLIENTE) {
      res.status(404).json({ error: "Cliente no encontrado" });
      return;
    }

    // Validar que existe una asignación activa
    const assignment = await Assignment.findOne({
      where: { choferId, clienteId, status: "assigned" }
    });

    if (!assignment) {
      res.status(400).json({ error: "No tenés una asignación activa con este cliente" });
      return;
    }

    // Calcular totales
    let subtotal = 0;
    const productosConSubtotal = productos.map((p: any) => {
      const itemSubtotal = p.cantidad * p.precio;
      subtotal += itemSubtotal;
      return {
        nombre: p.nombre,
        cantidad: p.cantidad,
        precio: p.precio,
        subtotal: itemSubtotal,
      };
    });

    const iva = subtotal * 0.21; // 21% IVA
    const total = subtotal + iva;

    // Crear remito
    const remito = await Remito.create({
      clienteId,
      choferId,
      fecha: new Date(),
      productos: productosConSubtotal,
      subtotal,
      iva,
      total,
      notas,
    });

    // Marcar asignación como completada
    await assignment.update({ status: "done" });

    // Marcar cliente como visitado
    await cliente.update({ status: ClientStatus.VISITADO });

    res.status(201).json({
      message: "Remito creado y cliente marcado como visitado",
      remito: {
        id: remito.id,
        clienteId: remito.clienteId,
        choferId: remito.choferId,
        fecha: remito.fecha,
        productos: remito.productos,
        subtotal: remito.subtotal,
        iva: remito.iva,
        total: remito.total,
        notas: remito.notas,
      },
      assignment: {
        status: "done",
      },
      cliente: {
        id: cliente.id,
        status: "visitado",
      },
    });
  } catch (error) {
    console.error("Create remito error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getRemito = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const remito = await Remito.findByPk(id, {
      include: [
        { model: User, as: "cliente", attributes: ["id", "nombre", "cuit", "ubicacion"] },
        { model: User, as: "chofer", attributes: ["id", "nombre"] },
      ],
    });

    if (!remito) {
      res.status(404).json({ error: "Remito no encontrado" });
      return;
    }

    res.json({ remito });
  } catch (error) {
    console.error("Get remito error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getRemitosByCliente = async (req: AuthRequest, res: Response): Promise<void> => {
  const { clienteId } = req.params;

  try {
    const remitos = await Remito.findAll({
      where: { clienteId },
      include: [
        { model: User, as: "chofer", attributes: ["id", "nombre"] },
      ],
      order: [["fecha", "DESC"]],
    });

    res.json({
      count: remitos.length,
      remitos,
    });
  } catch (error) {
    console.error("Get remitos by cliente error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMyRemitos = async (req: AuthRequest, res: Response): Promise<void> => {
  const choferId = req.user!.id;

  try {
    const remitos = await Remito.findAll({
      where: { choferId },
      include: [
        { model: User, as: "cliente", attributes: ["id", "nombre", "ubicacion"] },
      ],
      order: [["fecha", "DESC"]],
    });

    res.json({
      count: remitos.length,
      remitos,
    });
  } catch (error) {
    console.error("Get my remitos error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const generatePDF = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const remito = await Remito.findByPk(id, {
      include: [
        { model: User, as: "cliente", attributes: ["nombre", "cuit", "ubicacion", "telefono"] },
        { model: User, as: "chofer", attributes: ["nombre"] },
      ],
    });

    if (!remito) {
      res.status(404).json({ error: "Remito no encontrado" });
      return;
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=remito-${remito.id}.pdf`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).text("REMITO", { align: "center" });
    doc.moveDown();

    // Info del remito
    doc.fontSize(10);
    doc.text(`Remito N°: ${remito.id}`);
    doc.text(`Fecha: ${new Date(remito.fecha).toLocaleDateString("es-AR")}`);
    doc.moveDown();

    // Info del cliente
    const cliente = (remito as any).cliente;
    doc.fontSize(12).text("CLIENTE", { underline: true });
    doc.fontSize(10);
    doc.text(`Nombre: ${cliente.nombre}`);
    doc.text(`CUIT: ${cliente.cuit}`);
    doc.text(`Dirección: ${cliente.ubicacion}`);
    doc.text(`Teléfono: ${cliente.telefono}`);
    doc.moveDown();

    // Info del chofer
    const chofer = (remito as any).chofer;
    doc.fontSize(12).text("CHOFER", { underline: true });
    doc.fontSize(10);
    doc.text(`Nombre: ${chofer.nombre}`);
    doc.moveDown();

    // Tabla de productos
    doc.fontSize(12).text("PRODUCTOS", { underline: true });
    doc.moveDown(0.5);

    // Headers de tabla
    doc.fontSize(10);
    const tableTop = doc.y;
    doc.text("Producto", 50, tableTop);
    doc.text("Cant.", 250, tableTop);
    doc.text("Precio", 320, tableTop);
    doc.text("Subtotal", 400, tableTop);

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Filas de productos
    let y = tableTop + 25;
    remito.productos.forEach((producto: any) => {
      doc.text(producto.nombre, 50, y);
      doc.text(producto.cantidad.toString(), 250, y);
      doc.text(`$${producto.precio.toFixed(2)}`, 320, y);
      doc.text(`$${producto.subtotal.toFixed(2)}`, 400, y);
      y += 20;
    });

    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 15;

    // Totales
    doc.text(`Subtotal: $${Number(remito.subtotal).toFixed(2)}`, 320, y);
    y += 15;
    doc.text(`IVA (21%): $${Number(remito.iva).toFixed(2)}`, 320, y);
    y += 15;
    doc.fontSize(12).text(`TOTAL: $${Number(remito.total).toFixed(2)}`, 320, y);

    // Notas
    if (remito.notas) {
      doc.moveDown(2);
      doc.fontSize(10).text(`Notas: ${remito.notas}`);
    }

    doc.end();
  } catch (error) {
    console.error("Generate PDF error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};