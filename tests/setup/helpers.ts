import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User } from '../../src/models';
import { Role, ClientStatus } from '../../src/types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export function generateToken(payload: { id: string; email: string; role: Role }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

export function authHeader(token: string): [string, string] {
  return ['Authorization', `Bearer ${token}`];
}

export async function createAdmin(overrides: Record<string, any> = {}) {
  const rawPassword = overrides.password || 'password123';
  const hashedPassword = await bcrypt.hash(rawPassword, 10);
  const { password: _pw, ...rest } = overrides;
  return User.create({
    email: 'admin@test.com',
    role: Role.ADMIN,
    nombre: 'Admin Test',
    dni: '12345678',
    cuit: '20-12345678-9',
    telefono: '1234567890',
    ubicacion: 'Buenos Aires',
    ...rest,
    password: hashedPassword,
  });
}

export async function createChofer(overrides: Record<string, any> = {}) {
  const rawPassword = overrides.password || 'password123';
  const hashedPassword = await bcrypt.hash(rawPassword, 10);
  const { password: _pw, ...rest } = overrides;
  return User.create({
    email: 'chofer@test.com',
    role: Role.CHOFER,
    nombre: 'Chofer Test',
    dni: '87654321',
    cuit: '20-87654321-0',
    telefono: '0987654321',
    ubicacion: 'Rosario',
    ...rest,
    password: hashedPassword,
  });
}

export async function createCliente(overrides: Record<string, any> = {}) {
  const rawPassword = overrides.password || 'password123';
  const hashedPassword = await bcrypt.hash(rawPassword, 10);
  const { password: _pw, ...rest } = overrides;
  return User.create({
    email: 'cliente@test.com',
    role: Role.CLIENTE,
    nombre: 'Cliente Test',
    dni: '11223344',
    cuit: '20-11223344-5',
    telefono: '1122334455',
    ubicacion: 'Cordoba',
    ...rest,
    password: hashedPassword,
  });
}

export function tokenForUser(user: any): string {
  return generateToken({ id: user.id, email: user.email, role: user.role });
}
