import { setupTestServer, teardownTestServer, request } from '../../setup/test-server';
import { loginUser, testUsers, assertSuccessResponse, assertErrorResponse } from '../../setup/test-helpers';
import { Express } from 'express';

describe('Menu CRUD Operations', () => {
  let app: Express;
  let adminToken: string;
  let customerToken: string;

  beforeAll(async () => {
    app = await setupTestServer();
    adminToken = await loginUser(app, testUsers.admin.email, testUsers.admin.password);
    customerToken = await loginUser(app, testUsers.customer.email, testUsers.customer.password);
  });

  afterAll(async () => {
    await teardownTestServer();
  });

  describe('GET /api/v1/menu', () => {
    it('should get all menu items without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/menu');

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/v1/menu?category=main_course');

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
      expect(response.body.data.every((item: any) => item.category === 'main_course')).toBe(true);
    });

    it('should filter by availability', async () => {
      const response = await request(app)
        .get('/api/v1/menu?available=true');

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
      expect(response.body.data.every((item: any) => item.is_available === true)).toBe(true);
    });

    it('should search by name', async () => {
      const response = await request(app)
        .get('/api/v1/menu?search=burger');

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
      expect(response.body.data.some((item: any) => 
        item.name.toLowerCase().includes('burger')
      )).toBe(true);
    });

    it('should filter by price range', async () => {
      const response = await request(app)
        .get('/api/v1/menu?minPrice=10&maxPrice=20');

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
      expect(response.body.data.every((item: any) => 
        item.price >= 10 && item.price <= 20
      )).toBe(true);
    });
  });

  describe('GET /api/v1/menu/:id', () => {
    it('should get a single menu item by id', async () => {
      // First get all items
      const listResponse = await request(app).get('/api/v1/menu');
      const itemId = listResponse.body.data[0].id;

      const response = await request(app)
        .get(`/api/v1/menu/${itemId}`);

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
      expect(response.body.data.id).toBe(itemId);
    });

    it('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .get('/api/v1/menu/non-existent-id');

      expect(response.status).toBe(404);
      assertErrorResponse(response);
    });
  });

  describe('POST /api/v1/menu', () => {
    it('should create menu item as admin', async () => {
      const response = await request(app)
        .post('/api/v1/menu')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Test Item',
          description: 'Test description',
          price: 12.99,
          category: 'appetizers',
          preparation_time: 10,
          image_url: 'https://example.com/image.jpg',
        });

      expect(response.status).toBe(201);
      assertSuccessResponse(response);
      expect(response.body.data.name).toBe('New Test Item');
      expect(response.body.data.price).toBe(12.99);
      expect(response.body.data.is_available).toBe(true);
    });

    it('should fail to create as customer', async () => {
      const response = await request(app)
        .post('/api/v1/menu')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Unauthorized Item',
          description: 'Test',
          price: 10.00,
          category: 'appetizers',
        });

      expect(response.status).toBe(403);
      assertErrorResponse(response);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/menu')
        .send({
          name: 'No Auth Item',
          description: 'Test',
          price: 10.00,
          category: 'appetizers',
        });

      expect(response.status).toBe(401);
      assertErrorResponse(response);
    });

    it('should fail with invalid data', async () => {
      const response = await request(app)
        .post('/api/v1/menu')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Item',
          price: -5, // Invalid negative price
          category: 'appetizers',
        });

      expect(response.status).toBe(400);
      assertErrorResponse(response);
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/menu')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Incomplete Item',
        });

      expect(response.status).toBe(400);
      assertErrorResponse(response);
    });
  });

  describe('PUT /api/v1/menu/:id', () => {
    it('should update menu item as admin', async () => {
      // Get an item first
      const listResponse = await request(app).get('/api/v1/menu');
      const itemId = listResponse.body.data[0].id;

      const response = await request(app)
        .put(`/api/v1/menu/${itemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          price: 19.99,
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
      expect(response.body.data.price).toBe(19.99);
      expect(response.body.data.description).toBe('Updated description');
    });

    it('should toggle availability', async () => {
      const listResponse = await request(app).get('/api/v1/menu');
      const itemId = listResponse.body.data[0].id;
      const currentAvailability = listResponse.body.data[0].is_available;

      const response = await request(app)
        .put(`/api/v1/menu/${itemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          is_available: !currentAvailability,
        });

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
      expect(response.body.data.is_available).toBe(!currentAvailability);
    });

    it('should fail to update as customer', async () => {
      const listResponse = await request(app).get('/api/v1/menu');
      const itemId = listResponse.body.data[0].id;

      const response = await request(app)
        .put(`/api/v1/menu/${itemId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          price: 25.99,
        });

      expect(response.status).toBe(403);
      assertErrorResponse(response);
    });

    it('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .put('/api/v1/menu/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          price: 15.99,
        });

      expect(response.status).toBe(404);
      assertErrorResponse(response);
    });
  });

  describe('DELETE /api/v1/menu/:id', () => {
    it('should delete menu item as admin', async () => {
      // Create item to delete
      const createResponse = await request(app)
        .post('/api/v1/menu')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Item to Delete',
          description: 'Will be deleted',
          price: 10.00,
          category: 'appetizers',
        });

      const itemId = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/v1/menu/${itemId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      assertSuccessResponse(response);

      // Verify deletion
      const getResponse = await request(app).get(`/api/v1/menu/${itemId}`);
      expect(getResponse.status).toBe(404);
    });

    it('should fail to delete as customer', async () => {
      const listResponse = await request(app).get('/api/v1/menu');
      const itemId = listResponse.body.data[0].id;

      const response = await request(app)
        .delete(`/api/v1/menu/${itemId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
      assertErrorResponse(response);
    });

    it('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .delete('/api/v1/menu/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      assertErrorResponse(response);
    });
  });
});
