import { Request, Response } from 'express';
import { Op } from 'sequelize';
import bcrypt from 'bcrypt';
import User from '../models/User';
import { Role } from '../types/auth';

const SALT_ROUNDS = 10;

const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

const isValidEmail = (str: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(str);
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  const { 
    email, 
    password, 
    role, 
    nombre, 
    dni, 
    cuit, 
    telefono, 
    ubicacion, 
    razonSocial, 
    tipoComercio, 
    notas, 
    foto,
    usuario,
    codigoArea
  } = req.body;

  if (!email || !password || !nombre || !dni || !cuit || !telefono || !ubicacion || !role) {
    res.status(400).json({ error: 'Email, password, nombre, dni, cuit, telefono, ubicacion y role son requeridos' });
    return;
  }

  const validRoles = [Role.ADMIN, Role.CLIENTE, Role.CHOFER];
  if (!validRoles.includes(role)) {
    res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: 'Invalid email format' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  const cuitRegex = /^\d{2}-\d{8}-\d{1}$/;
  if (!cuitRegex.test(cuit)) {
    res.status(400).json({ error: 'Invalid CUIT format. Use XX-XXXXXXXX-X' });
    return;
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: 'User with this email already exists' });
      return;
    }

    const existingDni = await User.findOne({ where: { dni } });
    if (existingDni) {
      res.status(409).json({ error: 'User with this DNI already exists' });
      return;
    }

    const existingCuit = await User.findOne({ where: { cuit } });
    if (existingCuit) {
      res.status(409).json({ error: 'User with this CUIT already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser = await User.create({
      email,
      password: hashedPassword,
      role,
      nombre,
      dni,
      cuit,
      telefono,
      ubicacion,
      razonSocial,
      tipoComercio,
      notas,
      foto,
      usuario,
      codigoArea,
    });

    res.status(201).json({
      message: 'User created successfully',
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
        usuario: newUser.usuario,
        codigoArea: newUser.codigoArea,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { 
    nombre, 
    dni, 
    cuit, 
    telefono, 
    ubicacion, 
    razonSocial, 
    tipoComercio, 
    notas, 
    foto, 
    role,
    usuario,
    codigoArea
  } = req.body;

  try {
    const user = await User.findByPk(id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await user.update({
      ...(nombre && { nombre }),
      ...(dni && { dni }),
      ...(cuit && { cuit }),
      ...(telefono && { telefono }),
      ...(ubicacion && { ubicacion }),
      ...(razonSocial !== undefined && { razonSocial }),
      ...(tipoComercio !== undefined && { tipoComercio }),
      ...(notas !== undefined && { notas }),
      ...(foto !== undefined && { foto }),
      ...(role && { role }),
      ...(usuario !== undefined && { usuario }),
      ...(codigoArea !== undefined && { codigoArea }),
    });

    res.status(200).json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        nombre: user.nombre,
        dni: user.dni,
        cuit: user.cuit,
        telefono: user.telefono,
        ubicacion: user.ubicacion,
        razonSocial: user.razonSocial,
        tipoComercio: user.tipoComercio,
        notas: user.notas,
        foto: user.foto,
        usuario: user.usuario,
        codigoArea: user.codigoArea,
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const findUser = async (req: Request, res: Response): Promise<void> => {
  const { search } = req.query;

  if (!search || typeof search !== 'string') {
    res.status(400).json({ error: 'Search parameter is required (id, dni, or email)' });
    return;
  }

  try {
    let whereClause;

    if (isValidUUID(search)) {
      whereClause = { [Op.or]: [{ id: search }, { dni: search }] };
    } else if (isValidEmail(search)) {
      whereClause = { email: search };
    } else {
      whereClause = { dni: search };
    }

    const user = await User.findOne({
      where: whereClause,
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Find user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const listUsersByRole = async (req: Request, res: Response): Promise<void> => {
  const { role } = req.params;

  const validRoles = Object.values(Role);
  if (!validRoles.includes(role as Role)) {
    res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    return;
  }

  try {
    const users = await User.findAll({
      where: { role },
      attributes: { exclude: ['password'] },
      order: [['nombre', 'ASC']],
    });

    res.status(200).json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    res.status(400).json({ error: 'newPassword is required' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  try {
    const user = await User.findByPk(id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.update({ password: hashedPassword });

    res.status(200).json({
      message: 'Password reset successfully',
      userId: user.id,
      email: user.email,
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};