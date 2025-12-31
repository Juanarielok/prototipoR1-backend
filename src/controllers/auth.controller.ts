import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { RegisterRequest, LoginRequest, Role } from '../types/auth';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Use env variable in production
const JWT_EXPIRES_IN = '24h';

// Temporary in-memory storage (replace with database later)
const users: { id: string; email: string; password: string; role: Role }[] = [];

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, role }: RegisterRequest = req.body;

  // Basic validation
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  // Validate role if provided
  const validRoles = Object.values(Role);
  const userRole = role || Role.CLIENTE; // Default to cliente
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

  // Check if user already exists
  const existingUser = users.find((user) => user.email === email);
  if (existingUser) {
    res.status(409).json({ error: 'User with this email already exists' });
    return;
  }

  // Create new user with hashed password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const newUser = {
    id: crypto.randomUUID(),
    email,
    password: hashedPassword,
    role: userRole,
  };

  users.push(newUser);

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
    },
    token,
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password }: LoginRequest = req.body;

  // Basic validation
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  // Find user by email
  const user = users.find((u) => u.email === email);
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  // Compare password with hash
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  // Generate JWT token
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
    },
    token,
  });
};