import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { RegisterRequest, LoginRequest, Role } from '../types/auth';
import User from '../models/User';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, role, nombre, dni, cuit, telefono, ubicacion, razonSocial, tipoComercio, notas, foto }: RegisterRequest = req.body;

  // Basic validation
  if (!email || !password || !nombre || !dni || !cuit || !telefono || !ubicacion) {
    res.status(400).json({ error: 'Email, password, nombre, dni, cuit, telefono y ubicacion son requeridos' });
    return;
  }

  // Validate role if provided
  const validRoles = Object.values(Role);
  const userRole = role || Role.CLIENTE;

  if (role && !validRoles.includes(role)) {
    res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    return;
  }

  // Check if email is valid format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: 'Invalid email format' });
    return;
  }

  // Check password length
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  // Validate CUIT format (XX-XXXXXXXX-X)
  const cuitRegex = /^\d{2}-\d{8}-\d{1}$/;
  if (!cuitRegex.test(cuit)) {
    res.status(400).json({ error: 'Invalid CUIT format. Use XX-XXXXXXXX-X' });
    return;
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: 'User with this email already exists' });
      return;
    }

    // Check if DNI already exists
    const existingDni = await User.findOne({ where: { dni } });
    if (existingDni) {
      res.status(409).json({ error: 'User with this DNI already exists' });
      return;
    }

    // Check if CUIT already exists
    const existingCuit = await User.findOne({ where: { cuit } });
    if (existingCuit) {
      res.status(409).json({ error: 'User with this CUIT already exists' });
      return;
    }

    // Create new user with hashed password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser = await User.create({
      email,
      password: hashedPassword,
      role: userRole,
      nombre,
      dni,
      cuit,
      telefono,
      ubicacion,
      razonSocial,
      tipoComercio,
      notas,
      foto,
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        nombre: newUser.nombre,
        dni: newUser.dni,
        cuit: newUser.cuit,
        telefono: newUser.telefono,
        ubicacion: newUser.ubicacion,
        razonSocial: newUser.razonSocial,
        tipoComercio: newUser.tipoComercio,
        notas: newUser.notas,
        foto: newUser.foto,
      },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password }: LoginRequest = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        nombre: user.nombre,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};