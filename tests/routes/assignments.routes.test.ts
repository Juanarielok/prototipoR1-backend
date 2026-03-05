import request from 'supertest';
import app from '../../src/app';
import testSequelize from '../setup/testDatabase';
import { createAdmin, createChofer, createCliente, tokenForUser } from '../setup/helpers';
import { Assignment } from '../../src/models';
import '../../src/models';

beforeEach(async () => {
  await testSequelize.sync({ force: true });
});



describe('POST /assignments', () => {
  it('should assign clients to a chofer', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);
    const chofer = await createChofer();
    const cliente = await createCliente();

    const res = await request(app)
      .post('/assignments')
      .set('Authorization', `Bearer ${token}`)
      .send({ choferId: chofer.id, clientIds: [cliente.id] });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Asignados');
    expect(res.body.count).toBe(1);
    expect(res.body.choferId).toBe(chofer.id);
    expect(res.body.clientIds).toContain(cliente.id);
  });

  it('should update client status to asignado', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);
    const chofer = await createChofer();
    const cliente = await createCliente();

    await request(app)
      .post('/assignments')
      .set('Authorization', `Bearer ${token}`)
      .send({ choferId: chofer.id, clientIds: [cliente.id] });

    // Verify client status was updated
    const { User } = require('../../src/models');
    const updatedCliente = await User.findByPk(cliente.id);
    expect(updatedCliente.status).toBe('asignado');
  });

  it('should return 400 for missing fields', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);

    const res = await request(app)
      .post('/assignments')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('should return 404 for non-existent chofer', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);
    const cliente = await createCliente();

    const res = await request(app)
      .post('/assignments')
      .set('Authorization', `Bearer ${token}`)
      .send({ choferId: '00000000-0000-0000-0000-000000000000', clientIds: [cliente.id] });

    expect(res.status).toBe(404);
  });

  it('should return 400 if user is not a chofer', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);
    const cliente = await createCliente();

    const res = await request(app)
      .post('/assignments')
      .set('Authorization', `Bearer ${token}`)
      .send({ choferId: cliente.id, clientIds: [cliente.id] });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no es chofer/i);
  });

  it('should return 400 for no valid clients', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);
    const chofer = await createChofer();

    const res = await request(app)
      .post('/assignments')
      .set('Authorization', `Bearer ${token}`)
      .send({ choferId: chofer.id, clientIds: ['00000000-0000-0000-0000-000000000000'] });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/clientes válidos/i);
  });

  it('should handle duplicate assignments gracefully', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);
    const chofer = await createChofer();
    const cliente = await createCliente();

    // First assignment
    await request(app)
      .post('/assignments')
      .set('Authorization', `Bearer ${token}`)
      .send({ choferId: chofer.id, clientIds: [cliente.id] });

    // Second identical assignment should not error
    const res = await request(app)
      .post('/assignments')
      .set('Authorization', `Bearer ${token}`)
      .send({ choferId: chofer.id, clientIds: [cliente.id] });

    expect(res.status).toBe(201);
  });
});

describe('GET /assignments/me/count', () => {
  it('should return assignment count for chofer', async () => {
    const admin = await createAdmin();
    const adminToken = tokenForUser(admin);
    const chofer = await createChofer();
    const choferToken = tokenForUser(chofer);
    const cliente = await createCliente();

    await request(app)
      .post('/assignments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ choferId: chofer.id, clientIds: [cliente.id] });

    const res = await request(app)
      .get('/assignments/me/count')
      .set('Authorization', `Bearer ${choferToken}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
  });

  it('should return 0 when no assignments', async () => {
    const chofer = await createChofer();
    const token = tokenForUser(chofer);

    const res = await request(app)
      .get('/assignments/me/count')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });

  it('should return 403 for non-chofer', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);

    const res = await request(app)
      .get('/assignments/me/count')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

describe('GET /assignments/me', () => {
  it('should return assigned clients with details', async () => {
    const admin = await createAdmin();
    const adminToken = tokenForUser(admin);
    const chofer = await createChofer();
    const choferToken = tokenForUser(chofer);
    const cliente = await createCliente();

    await request(app)
      .post('/assignments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ choferId: chofer.id, clientIds: [cliente.id] });

    const res = await request(app)
      .get('/assignments/me')
      .set('Authorization', `Bearer ${choferToken}`);

    expect(res.status).toBe(200);
    expect(res.body.clientes).toHaveLength(1);
    expect(res.body.clientes[0].id).toBe(cliente.id);
    expect(res.body.clientes[0].nombre).toBe('Cliente Test');
  });

  it('should return empty when no assignments', async () => {
    const chofer = await createChofer();
    const token = tokenForUser(chofer);

    const res = await request(app)
      .get('/assignments/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.clientes).toHaveLength(0);
  });
});
