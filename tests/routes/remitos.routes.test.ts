import request from 'supertest';
import app from '../../src/app';
import testSequelize from '../setup/testDatabase';
import { createAdmin, createChofer, createCliente, tokenForUser } from '../setup/helpers';
import { Assignment, User } from '../../src/models';
import '../../src/models';

beforeEach(async () => {
  await testSequelize.sync({ force: true });
});


async function setupAssignment() {
  const admin = await createAdmin();
  const chofer = await createChofer();
  const cliente = await createCliente();

  await Assignment.create({
    choferId: chofer.id,
    clienteId: cliente.id,
    status: 'assigned',
  });

  return { admin, chofer, cliente };
}

const sampleProductos = [
  { nombre: 'Agua 500ml', cantidad: 10, precio: 500 },
  { nombre: 'Gaseosa 2L', cantidad: 5, precio: 1200 },
];

describe('POST /remitos', () => {
  it('should create a remito with correct totals', async () => {
    const { chofer, cliente } = await setupAssignment();
    const token = tokenForUser(chofer);

    const res = await request(app)
      .post('/remitos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clienteId: cliente.id,
        productos: sampleProductos,
        notas: 'Entrega completa',
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/Remito creado/);

    // Check totals: (10*500) + (5*1200) = 5000 + 6000 = 11000
    const subtotal = 11000;
    const iva = subtotal * 0.21; // 2310
    const total = subtotal + iva; // 13310

    expect(Number(res.body.remito.subtotal)).toBeCloseTo(subtotal, 2);
    expect(Number(res.body.remito.iva)).toBeCloseTo(iva, 2);
    expect(Number(res.body.remito.total)).toBeCloseTo(total, 2);
    expect(res.body.remito.productos).toHaveLength(2);
    expect(res.body.remito.productos[0].subtotal).toBe(5000);
    expect(res.body.remito.productos[1].subtotal).toBe(6000);
  });

  it('should mark assignment as done', async () => {
    const { chofer, cliente } = await setupAssignment();
    const token = tokenForUser(chofer);

    const res = await request(app)
      .post('/remitos')
      .set('Authorization', `Bearer ${token}`)
      .send({ clienteId: cliente.id, productos: sampleProductos });

    expect(res.status).toBe(201);
    expect(res.body.assignment.status).toBe('done');

    // Verify in DB
    const assignment = await Assignment.findOne({
      where: { choferId: chofer.id, clienteId: cliente.id },
    });
    expect(assignment!.status).toBe('done');
  });

  it('should mark client as visitado', async () => {
    const { chofer, cliente } = await setupAssignment();
    const token = tokenForUser(chofer);

    await request(app)
      .post('/remitos')
      .set('Authorization', `Bearer ${token}`)
      .send({ clienteId: cliente.id, productos: sampleProductos });

    const updatedCliente = await User.findByPk(cliente.id);
    expect(updatedCliente!.status).toBe('visitado');
  });

  it('should return 400 for missing fields', async () => {
    const chofer = await createChofer();
    const token = tokenForUser(chofer);

    const res = await request(app)
      .post('/remitos')
      .set('Authorization', `Bearer ${token}`)
      .send({ clienteId: 'some-id' });

    expect(res.status).toBe(400);
  });

  it('should return 400 for empty productos array', async () => {
    const { chofer, cliente } = await setupAssignment();
    const token = tokenForUser(chofer);

    const res = await request(app)
      .post('/remitos')
      .set('Authorization', `Bearer ${token}`)
      .send({ clienteId: cliente.id, productos: [] });

    expect(res.status).toBe(400);
  });

  it('should return 404 for non-existent client', async () => {
    const chofer = await createChofer();
    const token = tokenForUser(chofer);

    const res = await request(app)
      .post('/remitos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clienteId: '00000000-0000-0000-0000-000000000000',
        productos: sampleProductos,
      });

    expect(res.status).toBe(404);
  });

  it('should return 400 without active assignment', async () => {
    const chofer = await createChofer();
    const cliente = await createCliente();
    const token = tokenForUser(chofer);

    const res = await request(app)
      .post('/remitos')
      .set('Authorization', `Bearer ${token}`)
      .send({ clienteId: cliente.id, productos: sampleProductos });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/asignación/i);
  });
});

describe('GET /remitos/me', () => {
  it('should return chofer remitos', async () => {
    const { chofer, cliente } = await setupAssignment();
    const token = tokenForUser(chofer);

    await request(app)
      .post('/remitos')
      .set('Authorization', `Bearer ${token}`)
      .send({ clienteId: cliente.id, productos: sampleProductos });

    const res = await request(app)
      .get('/remitos/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.remitos).toHaveLength(1);
  });

  it('should return empty when no remitos', async () => {
    const chofer = await createChofer();
    const token = tokenForUser(chofer);

    const res = await request(app)
      .get('/remitos/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.remitos).toHaveLength(0);
  });
});

describe('GET /remitos/cliente/:clienteId', () => {
  it('should return client remitos', async () => {
    const { chofer, cliente } = await setupAssignment();
    const choferToken = tokenForUser(chofer);

    await request(app)
      .post('/remitos')
      .set('Authorization', `Bearer ${choferToken}`)
      .send({ clienteId: cliente.id, productos: sampleProductos });

    const res = await request(app)
      .get(`/remitos/cliente/${cliente.id}`)
      .set('Authorization', `Bearer ${choferToken}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
  });

  it('should return empty for client with no remitos', async () => {
    const chofer = await createChofer();
    const cliente = await createCliente();
    const token = tokenForUser(chofer);

    const res = await request(app)
      .get(`/remitos/cliente/${cliente.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });
});

describe('GET /remitos/:id', () => {
  it('should return remito with included relations', async () => {
    const { chofer, cliente } = await setupAssignment();
    const token = tokenForUser(chofer);

    const createRes = await request(app)
      .post('/remitos')
      .set('Authorization', `Bearer ${token}`)
      .send({ clienteId: cliente.id, productos: sampleProductos });

    const remitoId = createRes.body.remito.id;

    const res = await request(app)
      .get(`/remitos/${remitoId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.remito.id).toBe(remitoId);
    expect(res.body.remito.cliente).toBeDefined();
    expect(res.body.remito.cliente.nombre).toBe('Cliente Test');
    expect(res.body.remito.chofer).toBeDefined();
    expect(res.body.remito.chofer.nombre).toBe('Chofer Test');
  });

  it('should return 404 for non-existent remito', async () => {
    const chofer = await createChofer();
    const token = tokenForUser(chofer);

    const res = await request(app)
      .get('/remitos/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe('GET /remitos/:id/pdf', () => {
  it('should return PDF content-type', async () => {
    const { chofer, cliente } = await setupAssignment();
    const token = tokenForUser(chofer);

    const createRes = await request(app)
      .post('/remitos')
      .set('Authorization', `Bearer ${token}`)
      .send({ clienteId: cliente.id, productos: sampleProductos });

    const remitoId = createRes.body.remito.id;

    const res = await request(app)
      .get(`/remitos/${remitoId}/pdf`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
    expect(res.headers['content-disposition']).toMatch(/remito-/);
  });

  it('should return 404 for non-existent remito', async () => {
    const chofer = await createChofer();
    const token = tokenForUser(chofer);

    const res = await request(app)
      .get('/remitos/00000000-0000-0000-0000-000000000000/pdf')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('should return 401 without auth', async () => {
    const res = await request(app)
      .get('/remitos/00000000-0000-0000-0000-000000000000/pdf');

    expect(res.status).toBe(401);
  });
});
