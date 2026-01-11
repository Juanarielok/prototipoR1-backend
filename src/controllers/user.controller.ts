import { Request, Response } from 'express';
import { Op } from 'sequelize';
import User from '../models/User';

// Helper para validar UUID
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { nombre, dni, cuit, telefono, ubicacion, razonSocial, tipoComercio, notas, foto, role } = req.body;

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
    res.status(400).json({ error: 'Search parameter is required (dni or id)' });
    return;
  }

  try {
    // Build where clause based on search type
    const whereClause = isValidUUID(search)
      ? { [Op.or]: [{ id: search }, { dni: search }] }
      : { dni: search };

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