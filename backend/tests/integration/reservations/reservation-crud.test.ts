import { setupTestServer, teardownTestServer, request } from '../../setup/test-server';
import { loginUser, testUsers, assertSuccessResponse, assertErrorResponse } from '../../setup/test-helpers';
import { Express } from 'express';
import { prisma } from '../../setup/test-db';

describe('Reservation Management', () => {
  let app: Express;
  let customerToken: string;
  let receptionToken: string;
  let tableId: string;

  beforeAll(async () => {
    app = await setupTestServer();
    customerToken = await loginUser(app, testUsers.customer.email, testUsers.customer.password);
    receptionToken = await loginUser(app, testUsers.reception.email, testUsers.reception.password);
    
    const tables = await prisma.table.findMany();
    tableId = tables[0].id;
  });

  afterAll(async () => {
    await teardownTestServer();
  });

  describe('POST /api/v1/reservations', () => {
    it('should create reservation successfully', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      futureDate.setHours(19, 0, 0, 0);

      const response = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          table_id: tableId,
          date: futureDate.toISOString(),
          party_size: 4,
          special_request: 'Window seat preferred',
        });

      expect(response.status).toBe(201);
      assertSuccessResponse(response);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.party_size).toBe(4);
      expect(response.body.data.status).toBe('pending');
    });

    it('should fail with past date', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const response = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          table_id: tableId,
          date: pastDate.toISOString(),
          party_size: 2,
        });

      expect(response.status).toBe(400);
      assertErrorResponse(response);
    });

    it('should fail with invalid party size', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const response = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          table_id: tableId,
          date: futureDate.toISOString(),
          party_size: 0,
        });

      expect(response.status).toBe(400);
      assertErrorResponse(response);
    });
  });

  describe('GET /api/v1/reservations', () => {
    it('should get customer reservations', async () => {
      const response = await request(app)
        .get('/api/v1/reservations')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/v1/reservations?status=pending')
        .set('Authorization', `Bearer ${receptionToken}`);

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
    });
  });

  describe('PATCH /api/v1/reservations/:id/status', () => {
    it('should confirm reservation as reception', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);

      const createResponse = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          table_id: tableId,
          date: futureDate.toISOString(),
          party_size: 2,
        });

      const reservationId = createResponse.body.data.id;

      const response = await request(app)
        .patch(`/api/v1/reservations/${reservationId}/status`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .send({
          status: 'confirmed',
        });

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
      expect(response.body.data.status).toBe('confirmed');
    });
  });
});
