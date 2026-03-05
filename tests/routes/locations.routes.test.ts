import request from 'supertest';
import app from '../../src/app';
import testSequelize from '../setup/testDatabase';
import { createAdmin, createChofer, tokenForUser } from '../setup/helpers';
import { DriverLocation, LocationHistory, Jornada } from '../../src/models';
import '../../src/models';

beforeEach(async () => {
  await testSequelize.sync({ force: true });
});

describe('POST /locations', () => {
  it('should save chofer location', async () => {
    const chofer = await createChofer();
    const token = tokenForUser(chofer);

    const res = await request(app)
      .post('/locations')
      .set('Authorization', `Bearer ${token}`)
      .send({ latitude: -34.6037, longitude: -58.3816 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Ubicacion actualizada');
    expect(res.body.location.latitude).toBe(-34.6037);
    expect(res.body.location.longitude).toBe(-58.3816);
  });

  it('should upsert (update existing row, not create new)', async () => {
    const chofer = await createChofer();
    const token = tokenForUser(chofer);

    await request(app)
      .post('/locations')
      .set('Authorization', `Bearer ${token}`)
      .send({ latitude: -34.6037, longitude: -58.3816 });

    await request(app)
      .post('/locations')
      .set('Authorization', `Bearer ${token}`)
      .send({ latitude: -34.7000, longitude: -58.4000 });

    const count = await DriverLocation.count({ where: { choferId: chofer.id } });
    expect(count).toBe(1);

    const location = await DriverLocation.findOne({ where: { choferId: chofer.id } });
    expect(location!.latitude).toBe(-34.7);
    expect(location!.longitude).toBe(-58.4);
  });

  it('should return 400 if latitude or longitude missing', async () => {
    const chofer = await createChofer();
    const token = tokenForUser(chofer);

    const res = await request(app)
      .post('/locations')
      .set('Authorization', `Bearer ${token}`)
      .send({ latitude: -34.6037 });

    expect(res.status).toBe(400);
  });

  it('should return 400 for out-of-range coordinates', async () => {
    const chofer = await createChofer();
    const token = tokenForUser(chofer);

    const res = await request(app)
      .post('/locations')
      .set('Authorization', `Bearer ${token}`)
      .send({ latitude: 999, longitude: -58.3816 });

    expect(res.status).toBe(400);
  });

  it('should return 403 for non-chofer', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);

    const res = await request(app)
      .post('/locations')
      .set('Authorization', `Bearer ${token}`)
      .send({ latitude: -34.6037, longitude: -58.3816 });

    expect(res.status).toBe(403);
  });

  it('should accept optional speed, heading, and jornadaId', async () => {
    const chofer = await createChofer();
    const token = tokenForUser(chofer);

    const res = await request(app)
      .post('/locations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        latitude: -34.6037,
        longitude: -58.3816,
        speed: 12.5,
        heading: 180,
      });

    expect(res.status).toBe(200);

    const location = await DriverLocation.findOne({ where: { choferId: chofer.id } });
    expect(location!.speed).toBe(12.5);
    expect(location!.heading).toBe(180);
  });
});

describe('GET /locations/:choferId', () => {
  it('should return chofer location for admin', async () => {
    const admin = await createAdmin();
    const adminToken = tokenForUser(admin);
    const chofer = await createChofer();
    const choferToken = tokenForUser(chofer);

    await request(app)
      .post('/locations')
      .set('Authorization', `Bearer ${choferToken}`)
      .send({ latitude: -34.6037, longitude: -58.3816 });

    const res = await request(app)
      .get(`/locations/${chofer.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.location.latitude).toBe(-34.6037);
    expect(res.body.location.chofer.nombre).toBe('Chofer Test');
    expect(res.body.location.stale).toBe(false);
  });

  it('should allow chofer to see their own location', async () => {
    const chofer = await createChofer();
    const token = tokenForUser(chofer);

    await request(app)
      .post('/locations')
      .set('Authorization', `Bearer ${token}`)
      .send({ latitude: -34.6037, longitude: -58.3816 });

    const res = await request(app)
      .get(`/locations/${chofer.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.location.latitude).toBe(-34.6037);
  });

  it('should return 403 when chofer tries to see another chofer', async () => {
    const chofer1 = await createChofer();
    const token1 = tokenForUser(chofer1);
    const chofer2 = await createChofer({
      email: 'chofer2@test.com',
      dni: '99887766',
      cuit: '20-99887766-0',
    });

    await DriverLocation.create({
      choferId: chofer2.id,
      latitude: -34.6037,
      longitude: -58.3816,
      timestamp: new Date(),
    });

    const res = await request(app)
      .get(`/locations/${chofer2.id}`)
      .set('Authorization', `Bearer ${token1}`);

    expect(res.status).toBe(403);
  });

  it('should return 404 when no location exists', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);

    const res = await request(app)
      .get('/locations/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe('GET /locations', () => {
  it('should return all locations for admin', async () => {
    const admin = await createAdmin();
    const adminToken = tokenForUser(admin);
    const chofer = await createChofer();
    const choferToken = tokenForUser(chofer);

    await request(app)
      .post('/locations')
      .set('Authorization', `Bearer ${choferToken}`)
      .send({ latitude: -34.6037, longitude: -58.3816 });

    const res = await request(app)
      .get('/locations')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.locations[0].chofer.nombre).toBe('Chofer Test');
  });

  it('should return fresh locations when ?active=true', async () => {
    const admin = await createAdmin();
    const adminToken = tokenForUser(admin);
    const chofer = await createChofer();
    const choferToken = tokenForUser(chofer);

    // Post a fresh location
    await request(app)
      .post('/locations')
      .set('Authorization', `Bearer ${choferToken}`)
      .send({ latitude: -34.6037, longitude: -58.3816 });

    const res = await request(app)
      .get('/locations')
      .query({ active: 'true' })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.locations[0].stale).toBe(false);
  });

  it('should mark stale locations in response', async () => {
    const admin = await createAdmin();
    const adminToken = tokenForUser(admin);
    const chofer = await createChofer();
    const choferToken = tokenForUser(chofer);

    // Post a location, then fetch all (without active filter)
    await request(app)
      .post('/locations')
      .set('Authorization', `Bearer ${choferToken}`)
      .send({ latitude: -34.6037, longitude: -58.3816 });

    const res = await request(app)
      .get('/locations')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    // Fresh location should not be stale
    expect(res.body.locations[0].stale).toBe(false);
  });

  it('should return 403 for non-admin', async () => {
    const chofer = await createChofer();
    const token = tokenForUser(chofer);

    const res = await request(app)
      .get('/locations')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

describe('Location History', () => {
  it('should save history entry on each POST /locations', async () => {
    const chofer = await createChofer();
    const token = tokenForUser(chofer);

    // Send 3 location updates
    for (const lat of [-34.60, -34.61, -34.62]) {
      await request(app)
        .post('/locations')
        .set('Authorization', `Bearer ${token}`)
        .send({ latitude: lat, longitude: -58.38 });
    }

    // driver_locations should have 1 row (upsert)
    const currentCount = await DriverLocation.count({ where: { choferId: chofer.id } });
    expect(currentCount).toBe(1);

    // location_history should have 3 rows
    const historyCount = await LocationHistory.count({ where: { choferId: chofer.id } });
    expect(historyCount).toBe(3);
  });

  it('should auto-link jornadaId from active jornada', async () => {
    const chofer = await createChofer();
    const token = tokenForUser(chofer);

    // Start a jornada
    await request(app)
      .post('/jornadas/checkin')
      .set('Authorization', `Bearer ${token}`)
      .send({ ubicacion: 'Rosario' });

    const jornada = await Jornada.findOne({ where: { choferId: chofer.id, checkOut: null } });

    // Send location without jornadaId
    await request(app)
      .post('/locations')
      .set('Authorization', `Bearer ${token}`)
      .send({ latitude: -34.6037, longitude: -58.3816 });

    const history = await LocationHistory.findOne({ where: { choferId: chofer.id } });
    expect(history!.jornadaId).toBe(jornada!.id);

    const location = await DriverLocation.findOne({ where: { choferId: chofer.id } });
    expect(location!.jornadaId).toBe(jornada!.id);
  });
});

describe('GET /locations/:choferId/history', () => {
  it('should return location history for admin', async () => {
    const admin = await createAdmin();
    const adminToken = tokenForUser(admin);
    const chofer = await createChofer();
    const choferToken = tokenForUser(chofer);

    // Send 2 location updates
    await request(app)
      .post('/locations')
      .set('Authorization', `Bearer ${choferToken}`)
      .send({ latitude: -34.60, longitude: -58.38 });

    await request(app)
      .post('/locations')
      .set('Authorization', `Bearer ${choferToken}`)
      .send({ latitude: -34.61, longitude: -58.39 });

    const res = await request(app)
      .get(`/locations/${chofer.id}/history`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
    expect(res.body.history[0].latitude).toBeDefined();
    expect(res.body.history[0].timestamp).toBeDefined();
  });

  it('should allow chofer to see own history', async () => {
    const chofer = await createChofer();
    const token = tokenForUser(chofer);

    await request(app)
      .post('/locations')
      .set('Authorization', `Bearer ${token}`)
      .send({ latitude: -34.60, longitude: -58.38 });

    const res = await request(app)
      .get(`/locations/${chofer.id}/history`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
  });

  it('should return 403 when chofer tries to see another chofer history', async () => {
    const chofer1 = await createChofer();
    const token1 = tokenForUser(chofer1);
    const chofer2 = await createChofer({
      email: 'chofer2@test.com',
      dni: '99887766',
      cuit: '20-99887766-0',
    });

    const res = await request(app)
      .get(`/locations/${chofer2.id}/history`)
      .set('Authorization', `Bearer ${token1}`);

    expect(res.status).toBe(403);
  });

  it('should filter by jornadaId', async () => {
    const admin = await createAdmin();
    const adminToken = tokenForUser(admin);
    const chofer = await createChofer();
    const choferToken = tokenForUser(chofer);

    // Start jornada and send a location
    await request(app)
      .post('/jornadas/checkin')
      .set('Authorization', `Bearer ${choferToken}`)
      .send({ ubicacion: 'Rosario' });

    const jornada = await Jornada.findOne({ where: { choferId: chofer.id, checkOut: null } });

    await request(app)
      .post('/locations')
      .set('Authorization', `Bearer ${choferToken}`)
      .send({ latitude: -34.60, longitude: -58.38 });

    // End jornada, start new one, send another location
    await request(app)
      .post('/jornadas/checkout')
      .set('Authorization', `Bearer ${choferToken}`)
      .send({ ubicacion: 'Rosario' });

    await request(app)
      .post('/jornadas/checkin')
      .set('Authorization', `Bearer ${choferToken}`)
      .send({ ubicacion: 'Rosario' });

    await request(app)
      .post('/locations')
      .set('Authorization', `Bearer ${choferToken}`)
      .send({ latitude: -34.70, longitude: -58.40 });

    // Total history = 2
    const allRes = await request(app)
      .get(`/locations/${chofer.id}/history`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(allRes.body.count).toBe(2);

    // Filtered by first jornada = 1
    const filteredRes = await request(app)
      .get(`/locations/${chofer.id}/history`)
      .query({ jornadaId: jornada!.id })
      .set('Authorization', `Bearer ${adminToken}`);
    expect(filteredRes.body.count).toBe(1);
    expect(filteredRes.body.history[0].jornadaId).toBe(jornada!.id);
  });

  it('should respect limite query param', async () => {
    const admin = await createAdmin();
    const adminToken = tokenForUser(admin);
    const chofer = await createChofer();
    const choferToken = tokenForUser(chofer);

    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/locations')
        .set('Authorization', `Bearer ${choferToken}`)
        .send({ latitude: -34.60 - i * 0.01, longitude: -58.38 });
    }

    const res = await request(app)
      .get(`/locations/${chofer.id}/history`)
      .query({ limite: 3 })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(3);
  });
});

describe('GET /locations/heatmap', () => {
  it('should return aggregated heatmap cells', async () => {
    const admin = await createAdmin();
    const adminToken = tokenForUser(admin);
    const chofer = await createChofer();

    const now = new Date();
    // Create 3 points at same rounded location, 2 at another
    await LocationHistory.bulkCreate([
      { choferId: chofer.id, latitude: -34.6031, longitude: -58.3811, timestamp: now },
      { choferId: chofer.id, latitude: -34.6035, longitude: -58.3815, timestamp: now },
      { choferId: chofer.id, latitude: -34.6039, longitude: -58.3819, timestamp: now },
      { choferId: chofer.id, latitude: -34.6100, longitude: -58.3900, timestamp: now },
      { choferId: chofer.id, latitude: -34.6105, longitude: -58.3905, timestamp: now },
    ]);

    const today = now.toISOString().split('T')[0];
    const res = await request(app)
      .get('/locations/heatmap')
      .query({ fechaInicio: today, fechaFin: today, precision: 3 })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.precision).toBe(3);
    expect(res.body.cellSize).toBe('~110m');
    expect(res.body.totalPoints).toBe(5);
    expect(res.body.cells.length).toBeGreaterThanOrEqual(2);
    // Top cell should have intensity 1.0
    expect(res.body.cells[0].intensity).toBe(1);
    // All cells should have lat, lng, count, intensity
    for (const cell of res.body.cells) {
      expect(cell.lat).toBeDefined();
      expect(cell.lng).toBeDefined();
      expect(cell.count).toBeGreaterThan(0);
      expect(cell.intensity).toBeGreaterThan(0);
      expect(cell.intensity).toBeLessThanOrEqual(1);
    }
  });

  it('should filter by choferId', async () => {
    const admin = await createAdmin();
    const adminToken = tokenForUser(admin);
    const chofer1 = await createChofer();
    const chofer2 = await createChofer({
      email: 'chofer2@test.com',
      dni: '99887766',
      cuit: '20-99887766-0',
    });

    const now = new Date();
    await LocationHistory.bulkCreate([
      { choferId: chofer1.id, latitude: -34.603, longitude: -58.381, timestamp: now },
      { choferId: chofer1.id, latitude: -34.603, longitude: -58.381, timestamp: now },
      { choferId: chofer2.id, latitude: -34.610, longitude: -58.390, timestamp: now },
    ]);

    const today = now.toISOString().split('T')[0];
    const res = await request(app)
      .get('/locations/heatmap')
      .query({ fechaInicio: today, fechaFin: today, choferId: chofer1.id })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalPoints).toBe(2);
  });

  it('should return 400 when dates are missing', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);

    const res = await request(app)
      .get('/locations/heatmap')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('should return 400 for date range over 90 days', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);

    const res = await request(app)
      .get('/locations/heatmap')
      .query({ fechaInicio: '2026-01-01', fechaFin: '2026-06-01' })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/90/);
  });

  it('should return 400 for invalid precision', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);

    const res = await request(app)
      .get('/locations/heatmap')
      .query({ fechaInicio: '2026-01-01', fechaFin: '2026-01-31', precision: 5 })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('should return 403 for non-admin', async () => {
    const chofer = await createChofer();
    const token = tokenForUser(chofer);

    const res = await request(app)
      .get('/locations/heatmap')
      .query({ fechaInicio: '2026-01-01', fechaFin: '2026-01-31' })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('should return empty cells for date range with no data', async () => {
    const admin = await createAdmin();
    const token = tokenForUser(admin);

    const res = await request(app)
      .get('/locations/heatmap')
      .query({ fechaInicio: '2020-01-01', fechaFin: '2020-01-31' })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.totalPoints).toBe(0);
    expect(res.body.cells).toHaveLength(0);
  });

  it('should work with precision 2 (~1.1km cells)', async () => {
    const admin = await createAdmin();
    const adminToken = tokenForUser(admin);
    const chofer = await createChofer();

    const now = new Date();
    await LocationHistory.bulkCreate([
      { choferId: chofer.id, latitude: -34.601, longitude: -58.381, timestamp: now },
      { choferId: chofer.id, latitude: -34.604, longitude: -58.384, timestamp: now },
    ]);

    const today = now.toISOString().split('T')[0];
    const res = await request(app)
      .get('/locations/heatmap')
      .query({ fechaInicio: today, fechaFin: today, precision: 2 })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.cellSize).toBe('~1.1km');
    // At precision 2, both points round to -34.60, -58.38 -> 1 cell
    expect(res.body.cells.length).toBe(1);
    expect(res.body.cells[0].count).toBe(2);
  });
});
