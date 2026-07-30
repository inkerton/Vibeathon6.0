import { setupTestServer, teardownTestServer, request } from '../../setup/test-server';
import { loginUser, testUsers, assertSuccessResponse, assertErrorResponse } from '../../setup/test-helpers';
import { Express } from 'express';

describe('Inventory Management', () => {
  let app: Express;
  let inventoryToken: string;
  let adminToken: string;
  let customerToken: string;

  beforeAll(async () => {
    app = await setupTestServer();
    inventoryToken = await loginUser(app, testUsers.inventory.email, testUsers.inventory.password);
    adminToken = await loginUser(app, testUsers.admin.email, testUsers.admin.password);
    customerToken = await loginUser(app, testUsers.customer.email, testUsers.customer.password);
  });

  afterAll(async () => {
    await teardownTestServer();
  });

  describe('GET /api/v1/inventory', () => {
    it('should get all inventory items as inventory staff', async () => {
      const response = await request(app)
        .get('/api/v1/inventory')
        .set('Authorization', `Bearer ${inventoryToken}`);

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should get low stock items', async () => {
      const response = await request(app)
        .get('/api/v1/inventory?lowStock=true')
        .set('Authorization', `Bearer ${inventoryToken}`);

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
      expect(response.body.data.every((item: any) => 
        item.total_stock <= item.reorder_threshold
      )).toBe(true);
    });

    it('should fail as customer', async () => {
      const response = await request(app)
        .get('/api/v1/inventory')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
      assertErrorResponse(response);
    });
  });

  describe('POST /api/v1/inventory', () => {
    it('should create inventory item as admin', async () => {
      const response = await request(app)
        .post('/api/v1/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Ingredient',
          unit: 'kg',
          total_stock: 100,
          reorder_threshold: 20,
        });

      expect(response.status).toBe(201);
      assertSuccessResponse(response);
      expect(response.body.data.name).toBe('New Ingredient');
      expect(response.body.data.total_stock).toBe(100);
    });

    it('should fail with duplicate name', async () => {
      const response = await request(app)
        .post('/api/v1/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Tomatoes',
          unit: 'kg',
          total_stock: 50,
          reorder_threshold: 10,
        });

      expect(response.status).toBe(409);
      assertErrorResponse(response);
    });

    it('should fail with invalid data', async () => {
      const response = await request(app)
        .post('/api/v1/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Item',
          unit: 'kg',
          total_stock: -10,
        });

      expect(response.status).toBe(400);
      assertErrorResponse(response);
    });
  });

  describe('POST /api/v1/inventory/:id/transaction', () => {
    it('should add stock', async () => {
      const listResponse = await request(app)
        .get('/api/v1/inventory')
        .set('Authorization', `Bearer ${inventoryToken}`);
      
      const itemId = listResponse.body.data[0].id;
      const initialStock = listResponse.body.data[0].total_stock;

      const response = await request(app)
        .post(`/api/v1/inventory/${itemId}/transaction`)
        .set('Authorization', `Bearer ${inventoryToken}`)
        .send({
          type: 'add',
          quantity: 10,
          note: 'Restocking',
        });

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
      expect(response.body.data.total_stock).toBe(initialStock + 10);
    });

    it('should deduct stock', async () => {
      const listResponse = await request(app)
        .get('/api/v1/inventory')
        .set('Authorization', `Bearer ${inventoryToken}`);
      
      const itemId = listResponse.body.data[0].id;
      const initialStock = listResponse.body.data[0].total_stock;

      const response = await request(app)
        .post(`/api/v1/inventory/${itemId}/transaction`)
        .set('Authorization', `Bearer ${inventoryToken}`)
        .send({
          type: 'deduct',
          quantity: 5,
          note: 'Used in kitchen',
        });

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
      expect(response.body.data.total_stock).toBe(initialStock - 5);
    });

    it('should fail with insufficient stock', async () => {
      const listResponse = await request(app)
        .get('/api/v1/inventory')
        .set('Authorization', `Bearer ${inventoryToken}`);
      
      const itemId = listResponse.body.data[0].id;

      const response = await request(app)
        .post(`/api/v1/inventory/${itemId}/transaction`)
        .set('Authorization', `Bearer ${inventoryToken}`)
        .send({
          type: 'deduct',
          quantity: 10000,
          note: 'Too much',
        });

      expect(response.status).toBe(400);
      assertErrorResponse(response);
    });
  });

  describe('GET /api/v1/inventory/:id/transactions', () => {
    it('should get transaction history', async () => {
      const listResponse = await request(app)
        .get('/api/v1/inventory')
        .set('Authorization', `Bearer ${inventoryToken}`);
      
      const itemId = listResponse.body.data[0].id;

      const response = await request(app)
        .get(`/api/v1/inventory/${itemId}/transactions`)
        .set('Authorization', `Bearer ${inventoryToken}`);

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/inventory/alerts', () => {
    it('should get low stock alerts', async () => {
      const response = await request(app)
        .get('/api/v1/inventory/alerts')
        .set('Authorization', `Bearer ${inventoryToken}`);

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
