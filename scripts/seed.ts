import "dotenv/config";
import bcrypt from "bcrypt";
import { sequelize, User, Assignment } from "../src/models";
import { Role, ClientStatus } from "../src/types/auth";

async function seed() {
  try {
    await sequelize.authenticate();
    console.log("Database connected");

    await sequelize.sync({ alter: true });

    const existingAdmin = await User.findOne({ where: { role: Role.ADMIN } });
    if (existingAdmin) {
      console.log("Seed skipped: data already exists");
      process.exit(0);
    }

    console.log("Seeding database...");
    const hash = await bcrypt.hash("admin123", 10);

    // Admin
    await User.create({
      email: "admin@test.com",
      password: hash,
      role: Role.ADMIN,
      nombre: "Admin Test",
      dni: "10000001",
      cuit: "20-10000001-0",
      telefono: "1100000001",
      ubicacion: "Buenos Aires",
      usuario: "admin",
    });

    // Choferes
    const chofer1 = await User.create({
      email: "chofer1@test.com",
      password: hash,
      role: Role.CHOFER,
      nombre: "Carlos Lopez",
      dni: "20000001",
      cuit: "20-20000001-0",
      telefono: "1120000001",
      ubicacion: "Rosario",
      usuario: "clopez",
    });

    const chofer2 = await User.create({
      email: "chofer2@test.com",
      password: hash,
      role: Role.CHOFER,
      nombre: "Maria Garcia",
      dni: "20000002",
      cuit: "20-20000002-0",
      telefono: "1120000002",
      ubicacion: "Cordoba",
      usuario: "mgarcia",
    });

    // Clientes
    const cliente1 = await User.create({
      email: "cliente1@test.com",
      password: hash,
      role: Role.CLIENTE,
      nombre: "Kiosco Central",
      dni: "30000001",
      cuit: "20-30000001-0",
      telefono: "1130000001",
      ubicacion: "Rosario Centro",
      razonSocial: "Kiosco Central SRL",
      tipoComercio: "Kiosco",
      usuario: "kcentral",
      status: ClientStatus.DISPONIBLE,
    });

    const cliente2 = await User.create({
      email: "cliente2@test.com",
      password: hash,
      role: Role.CLIENTE,
      nombre: "Almacen Don Pedro",
      dni: "30000002",
      cuit: "20-30000002-0",
      telefono: "1130000002",
      ubicacion: "Rosario Norte",
      razonSocial: "Don Pedro SA",
      tipoComercio: "Almacen",
      usuario: "dpedro",
      status: ClientStatus.DISPONIBLE,
    });

    const cliente3 = await User.create({
      email: "cliente3@test.com",
      password: hash,
      role: Role.CLIENTE,
      nombre: "Supermercado El Sol",
      dni: "30000003",
      cuit: "20-30000003-0",
      telefono: "1130000003",
      ubicacion: "Cordoba Centro",
      razonSocial: "El Sol SRL",
      tipoComercio: "Supermercado",
      usuario: "elsol",
      status: ClientStatus.DISPONIBLE,
    });

    // Asignaciones: chofer1 -> cliente1, cliente2 | chofer2 -> cliente3
    await Assignment.bulkCreate([
      { choferId: chofer1.get("id"), clienteId: cliente1.get("id"), status: "assigned" },
      { choferId: chofer1.get("id"), clienteId: cliente2.get("id"), status: "assigned" },
      { choferId: chofer2.get("id"), clienteId: cliente3.get("id"), status: "assigned" },
    ]);

    await User.update(
      { status: ClientStatus.ASIGNADO },
      { where: { id: [cliente1.get("id"), cliente2.get("id"), cliente3.get("id")] } }
    );

    console.log("Seed completed:");
    console.log("  Admin:    admin@test.com / admin123");
    console.log("  Chofer 1: chofer1@test.com / admin123");
    console.log("  Chofer 2: chofer2@test.com / admin123");
    console.log("  3 clientes assigned to choferes");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seed();
