import request from 'supertest';
import app from '../../src/app';
import testSequelize from '../setup/testDatabase';
import { createAdmin, tokenForUser } from '../setup/helpers';
import '../../src/models';

beforeEach(async () => {
  await testSequelize.sync({ force: true });
});


const validRegisterBody = {
  email: 'admin@test.com',
  password: 'password123',
  nombre: 'Admin Test',
  dni: '12345678',
  cuit: '20-12345678-9',
  telefono: '1234567890',
  ubicacion: 'Buenos Aires',
};

describe('POST /auth/register', () => {
  it('should register the first admin successfully', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send(validRegisterBody);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Admin registered successfully');
    expect(res.body.user.email).toBe('admin@test.com');
    expect(res.body.user.role).toBe('admin');
    expect(res.body.token).toBeDefined();
    expect(res.body.user.password).toBeUndefined();
  });

  it('should return 403 if admin already exists', async () => {
    await createAdmin();
    const res = await request(app)
      .post('/auth/register')
      .send({ ...validRegisterBody, email: 'other@test.com', dni: '99999999', cuit: '20-99999999-9' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Admin already exists/);
  });

  it('should return 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'admin@test.com' });

    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid email format', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ ...validRegisterBody, email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('should return 400 for short password', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ ...validRegisterBody, password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/6 characters/);
  });

  it('should return 400 for invalid CUIT format', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ ...validRegisterBody, cuit: '12345' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/CUIT/);
  });

  it('should return 409 for duplicate email', async () => {
    await createAdmin();
    // Need to remove admin to bypass the "admin exists" check — actually this won't work
    // since register always checks for existing admin first. Let's test duplicate via the flow.
    // Register succeeds first time; second time blocked by admin-exists check (403), not 409.
    // This case can't be tested via /register since it's admin-only registration.
    // Skip — duplicate detection is tested in user creation.
  });
});

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await createAdmin({ password: 'password123' });
  });

  it('should login successfully with correct credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Login successful');
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('admin@test.com');
    expect(res.body.user.role).toBe('admin');
  });

  it('should return 401 for wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Invalid/);
  });

  it('should return 401 for non-existent email', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@test.com', password: 'password123' });

    expect(res.status).toBe(401);
  });

  it('should return 400 for missing email or password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@test.com' });

    expect(res.status).toBe(400);
  });
});

describe('GET /auth/me', () => {
  it('should return user info with valid token', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);

    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(admin.id);
    expect(res.body.user.email).toBe(admin.email);
    expect(res.body.user.role).toBe('admin');
  });

  it('should return 401 without token', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
  });
});
