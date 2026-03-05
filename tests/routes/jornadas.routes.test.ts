import request from 'supertest';
import app from '../../src/app';
import testSequelize from '../setup/testDatabase';
import { createAdmin, createChofer, createCliente, tokenForUser } from '../setup/helpers';
import { Jornada } from '../../src/models';
import '../../src/models';

beforeEach(async () => {
  await testSequelize.sync({ force: true });
});



describe('POST /jornadas/checkin', () => {
  it('should create a new jornada', async () => {
    const chofer = await createChofer();
    const token = tokenForUser(chofer);

    const res = await request(app)
      .post('/jornadas/checkin')
      .set('Authorization', `Bearer ${token}`)
      .send({ ubicacion: 'Rosario Centro', notas: 'Inicio de jornada' });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Check-in exitoso');
    expect(res.body.jornada.choferId).toBe(chofer.id);
    expect(res.body.jornada.ubicacionCheckIn).toBe('Rosario Centro');
    expect(res.body.jornada.notas).toBe('Inicio de jornada');
  });

  it('should return 400 if already has active jornada', async () => {
    const chofer = await createChofer();
    const token = tokenForUser(chofer);

    // First check-in
    await request(app)
      .post('/jornadas/checkin')
      .set('Authorization', `Bearer ${token}`)
      .send({ ubicacion: 'Rosario' });

    // Second check-in should fail
    const res = await request(app)
      .post('/jornadas/checkin')
      .set('Authorization', `Bearer ${token}`)
      .send({ ubicacion: 'Rosario' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/jornada activa/i);
  });

  it('should return 403 for non-chofer', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);

    const res = await request(app)
      .post('/jornadas/checkin')
      .set('Authorization', `Bearer ${token}`)
      .send({ ubicacion: 'Test' });

    expect(res.status).toBe(403);
  });
});

describe('POST /jornadas/checkout', () => {
  it('should close active jornada', async () => {
    const chofer = await createChofer();
    const token = tokenForUser(chofer);

    await request(app)
      .post('/jornadas/checkin')
      .set('Authorization', `Bearer ${token}`)
      .send({ ubicacion: 'Rosario' });

    const res = await request(app)
      .post('/jornadas/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ ubicacion: 'Rosario Sur' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Check-out exitoso');
    expect(res.body.jornada.checkOut).toBeDefined();
    expect(res.body.jornada.ubicacionCheckOut).toBe('Rosario Sur');
    expect(res.body.jornada.duracion).toBeDefined();
    expect(res.body.jornada.duracion.minutos).toBeGreaterThanOrEqual(0);
    expect(res.body.jornada.duracion.formato).toMatch(/\d+h \d+m/);
  });

  it('should return 400 if no active jornada', async () => {
    const chofer = await createChofer();
    const token = tokenForUser(chofer);

    const res = await request(app)
      .post('/jornadas/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ ubicacion: 'Test' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no ten/i);
  });

  it('should append notes to existing notes', async () => {
    const chofer = await createChofer();
    const token = tokenForUser(chofer);

    await request(app)
      .post('/jornadas/checkin')
      .set('Authorization', `Bearer ${token}`)
      .send({ notas: 'Inicio' });

    const res = await request(app)
      .post('/jornadas/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ notas: 'Fin' });

    expect(res.status).toBe(200);
    expect(res.body.jornada.notas).toContain('Inicio');
    expect(res.body.jornada.notas).toContain('Fin');
  });
});

describe('GET /jornadas/me', () => {
  it('should return active jornada', async () => {
    const chofer = await createChofer();
    const token = tokenForUser(chofer);

    await request(app)
      .post('/jornadas/checkin')
      .set('Authorization', `Bearer ${token}`)
      .send({ ubicacion: 'Rosario' });

    const res = await request(app)
      .get('/jornadas/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.activa).toBe(true);
    expect(res.body.jornada).toBeDefined();
    expect(res.body.jornada.tiempoTranscurrido).toBeDefined();
  });

  it('should return activa:false when no active jornada', async () => {
    const chofer = await createChofer();
    const token = tokenForUser(chofer);

    const res = await request(app)
      .get('/jornadas/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.activa).toBe(false);
    expect(res.body.jornada).toBeNull();
  });
});

describe('GET /jornadas/me/historial', () => {
  it('should return jornada history', async () => {
    const chofer = await createChofer();
    const token = tokenForUser(chofer);

    // Create and complete a jornada
    await request(app)
      .post('/jornadas/checkin')
      .set('Authorization', `Bearer ${token}`)
      .send({ ubicacion: 'Rosario' });

    await request(app)
      .post('/jornadas/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ ubicacion: 'Rosario' });

    const res = await request(app)
      .get('/jornadas/me/historial')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.jornadas).toHaveLength(1);
    expect(res.body.jornadas[0].duracion).toBeDefined();
  });

  it('should respect limite query param', async () => {
    const chofer = await createChofer();
    const token = tokenForUser(chofer);

    // Create 3 completed jornadas
    for (let i = 0; i < 3; i++) {
      await Jornada.create({
        choferId: chofer.id,
        checkIn: new Date(2024, 0, i + 1),
        checkOut: new Date(2024, 0, i + 1, 8),
      });
    }

    const res = await request(app)
      .get('/jornadas/me/historial')
      .query({ limite: 2 })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
    expect(res.body.jornadas).toHaveLength(2);
  });
});

describe('GET /jornadas/activas', () => {
  it('should return active jornadas with chofer info', async () => {
    const admin = await createAdmin();
    const adminToken = tokenForUser(admin);
    const chofer = await createChofer();
    const choferToken = tokenForUser(chofer);

    await request(app)
      .post('/jornadas/checkin')
      .set('Authorization', `Bearer ${choferToken}`)
      .send({ ubicacion: 'Rosario' });

    const res = await request(app)
      .get('/jornadas/activas')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.choferesActivos[0].chofer.nombre).toBe('Chofer Test');
    expect(res.body.choferesActivos[0].tiempoTranscurrido).toBeDefined();
  });

  it('should return 403 for non-admin', async () => {
    const chofer = await createChofer();
    const token = tokenForUser(chofer);

    const res = await request(app)
      .get('/jornadas/activas')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

describe('GET /jornadas/chofer/:choferId', () => {
  it('should return chofer history with summary', async () => {
    const admin = await createAdmin();
    const adminToken = tokenForUser(admin);
    const chofer = await createChofer();

    // Create a completed jornada directly
    await Jornada.create({
      choferId: chofer.id,
      checkIn: new Date(2024, 0, 1, 8, 0),
      checkOut: new Date(2024, 0, 1, 16, 0),
    });

    const res = await request(app)
      .get(`/jornadas/chofer/${chofer.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.chofer.id).toBe(chofer.id);
    expect(res.body.chofer.nombre).toBe('Chofer Test');
    expect(res.body.resumen.totalJornadas).toBe(1);
    expect(res.body.resumen.jornadasCompletadas).toBe(1);
    expect(res.body.resumen.tiempoTotal.minutos).toBeGreaterThan(0);
    expect(res.body.jornadas).toHaveLength(1);
  });

  it('should return 404 for non-existent chofer', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);

    const res = await request(app)
      .get('/jornadas/chofer/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('should return 404 for user that is not a chofer', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);
    const cliente = await createCliente();

    const res = await request(app)
      .get(`/jornadas/chofer/${cliente.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
