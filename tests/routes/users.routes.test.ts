import request from 'supertest';
import app from '../../src/app';
import testSequelize from '../setup/testDatabase';
import { createAdmin, createChofer, createCliente, tokenForUser } from '../setup/helpers';
import '../../src/models';

beforeEach(async () => {
  await testSequelize.sync({ force: true });
});


const newUserBody = {
  email: 'newuser@test.com',
  password: 'password123',
  role: 'chofer',
  nombre: 'New Chofer',
  dni: '55555555',
  cuit: '20-55555555-5',
  telefono: '5555555555',
  ubicacion: 'Mendoza',
};

describe('POST /users', () => {
  it('should create a user as admin', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);

    const res = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send(newUserBody);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('User created successfully');
    expect(res.body.user.email).toBe('newuser@test.com');
    expect(res.body.user.role).toBe('chofer');
    expect(res.body.user.password).toBeUndefined();
  });

  it('should return 401 without auth', async () => {
    const res = await request(app).post('/users').send(newUserBody);
    expect(res.status).toBe(401);
  });

  it('should return 403 as non-admin', async () => {
    const chofer = await createChofer();
    const token = tokenForUser(chofer);

    const res = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send(newUserBody);

    expect(res.status).toBe(403);
  });

  it('should return 400 for missing required fields', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);

    const res = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'test@test.com' });

    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid role', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);

    const res = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...newUserBody, role: 'invalid_role' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/role/i);
  });

  it('should return 409 for duplicate email', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);

    await createChofer();

    const res = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...newUserBody, email: 'chofer@test.com', dni: '99988877', cuit: '20-99988877-1' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/email/i);
  });

  it('should return 409 for duplicate DNI', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);

    await createChofer();

    const res = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...newUserBody, email: 'unique@test.com', dni: '87654321', cuit: '20-99988877-1' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/DNI/i);
  });

  it('should return 409 for duplicate CUIT', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);

    await createChofer();

    const res = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...newUserBody, email: 'unique@test.com', dni: '99988877', cuit: '20-87654321-0' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/CUIT/i);
  });
});

describe('GET /users/search', () => {
  it('should find user by email', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);
    const chofer = await createChofer();

    const res = await request(app)
      .get('/users/search')
      .query({ search: chofer.email })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(chofer.email);
    expect(res.body.user.password).toBeUndefined();
  });

  it('should find user by DNI', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);
    const chofer = await createChofer();

    const res = await request(app)
      .get('/users/search')
      .query({ search: chofer.dni })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.dni).toBe(chofer.dni);
  });

  it('should find user by UUID', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);
    const chofer = await createChofer();

    const res = await request(app)
      .get('/users/search')
      .query({ search: chofer.id })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(chofer.id);
  });

  it('should return 404 for unknown search', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);

    const res = await request(app)
      .get('/users/search')
      .query({ search: 'nonexistent@test.com' })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('should return 400 without search param', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);

    const res = await request(app)
      .get('/users/search')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});

describe('GET /users/role/:role', () => {
  it('should list users by role', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);
    await createChofer();
    await createCliente();

    const res = await request(app)
      .get('/users/role/chofer')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.users[0].role).toBe('chofer');
    expect(res.body.users[0].password).toBeUndefined();
  });

  it('should return 400 for invalid role', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);

    const res = await request(app)
      .get('/users/role/invalid')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('should return empty array for role with no users', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);

    const res = await request(app)
      .get('/users/role/chofer')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.users).toEqual([]);
  });
});

describe('PUT /users/:id', () => {
  it('should update user fields', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);
    const chofer = await createChofer();

    const res = await request(app)
      .put(`/users/${chofer.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Updated Name', telefono: '9999999999' });

    expect(res.status).toBe(200);
    expect(res.body.user.nombre).toBe('Updated Name');
    expect(res.body.user.telefono).toBe('9999999999');
  });

  it('should return 404 for non-existent user', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);

    const res = await request(app)
      .put('/users/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Test' });

    expect(res.status).toBe(404);
  });

  it('should return 403 as non-admin', async () => {
    const chofer = await createChofer();
    const token = tokenForUser(chofer);

    const res = await request(app)
      .put(`/users/${chofer.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Test' });

    expect(res.status).toBe(403);
  });
});

describe('PUT /users/:id/reset-password', () => {
  it('should reset password', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);
    const chofer = await createChofer();

    const res = await request(app)
      .put(`/users/${chofer.id}/reset-password`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newPassword: 'newpassword123' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Password reset successfully');

    // Verify login with new password works
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'chofer@test.com', password: 'newpassword123' });

    expect(loginRes.status).toBe(200);
  });

  it('should return 400 for short password', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);
    const chofer = await createChofer();

    const res = await request(app)
      .put(`/users/${chofer.id}/reset-password`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newPassword: '123' });

    expect(res.status).toBe(400);
  });

  it('should return 404 for non-existent user', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);

    const res = await request(app)
      .put('/users/00000000-0000-0000-0000-000000000000/reset-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ newPassword: 'newpassword123' });

    expect(res.status).toBe(404);
  });
});

describe('PATCH /users/:id/reset-status', () => {
  it('should reset client status to disponible', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);
    const cliente = await createCliente();

    const res = await request(app)
      .patch(`/users/${cliente.id}/reset-status`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('disponible');
  });

  it('should return 400 for non-client user', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);
    const chofer = await createChofer();

    const res = await request(app)
      .patch(`/users/${chofer.id}/reset-status`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('should return 404 for non-existent user', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);

    const res = await request(app)
      .patch('/users/00000000-0000-0000-0000-000000000000/reset-status')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
