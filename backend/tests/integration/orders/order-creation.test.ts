import { setupTestServer, teardownTestServer, request } from '../../setup/test-server';
import { loginUser, testUsers, assertSuccessResponse, assertErrorResponse } from '../../setup/test-helpers';
import { Express } from 'express';
import { prisma } from '../../setup/test-db';

describe('Order Creation and Management', () => {
  let app: Express;
  let customerToken: string;
  let kitchenToken: string;
  let customerId: string;
  let tableId: string;
  let menuItemIds: string[] = [];

  beforeAll(async () => {
    app = await setupTestServer();
    customerToken = await loginUser(app, testUsers.customer.email, testUsers.customer.password);
    kitchenToken = await loginUser(app, testUsers.kitchen.email, testUsers.kitchen.password);
    
    // Get customer ID
    const userResponse = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${customerToken}`);
    
    if (!userResponse.body || !userResponse.body.data) {
      throw new Error(`Failed to get user data: ${JSON.stringify(userResponse.body)}`);
    }
    customerId = userResponse.body.data.id;

    // Get table ID
    const tables = await prisma.table.findMany();
    tableId = tables[0].id;

    // Get menu item IDs
    const menuItems = await prisma.menuItem.findMany({ take: 3 });
    menuItemIds = menuItems.map(item => item.id);
  });

  afterAll(async () => {
    await teardownTestServer();
  });

  describe('POST /api/v1/orders', () => {
    it('should create order successfully', async () => {
      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          table_id: tableId,
          items: [
            {
              menu_item_id: menuItemIds[0],
              quantity: 2,
              custom_instructions: 'Extra cheese please',
            },
            {
              menu_item_id: menuItemIds[1],
              quantity: 1,
            },
          ],
        });

      expect(response.status).toBe(201);
      assertSuccessResponse(response);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('order_status');
      expect(response.body.data.order_status).toBe('placed');
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.total_amount).toBeGreaterThan(0);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/orders')
        .send({
          table_id: tableId,
          items: [
            {
              menu_item_id: menuItemIds[0],
              quantity: 1,
            },
          ],
        });

      expect(response.status).toBe(401);
      assertErrorResponse(response);
    });

    it('should fail with invalid table', async () => {
      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          table_id: 'invalid-table-id',
          items: [
            {
              menu_item_id: menuItemIds[0],
              quantity: 1,
            },
          ],
        });

      expect(response.status).toBe(400);
      assertErrorResponse(response);
    });

    it('should fail with empty items', async () => {
      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          table_id: tableId,
          items: [],
        });

      expect(response.status).toBe(400);
      assertErrorResponse(response);
    });

    it('should fail with invalid quantity', async () => {
      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          table_id: tableId,
          items: [
            {
              menu_item_id: menuItemIds[0],
              quantity: 0,
            },
          ],
        });

      expect(response.status).toBe(400);
      assertErrorResponse(response);
    });

    it('should calculate total amount correctly', async () => {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: menuItemIds[0] },
      });

      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          table_id: tableId,
          items: [
            {
              menu_item_id: menuItemIds[0],
              quantity: 3,
            },
          ],
        });

      expect(response.status).toBe(201);
      const expectedTotal = menuItem!.price * 3;
      expect(response.body.data.total_amount).toBeCloseTo(expectedTotal, 2);
    });
  });

  describe('GET /api/v1/orders', () => {
    it('should get all orders for customer', async () => {
      const response = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/v1/orders?status=placed')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
      expect(response.body.data.every((order: any) => order.order_status === 'placed')).toBe(true);
    });
  });

  describe('GET /api/v1/orders/:id', () => {
    it('should get order by id', async () => {
      // Create an order first
      const createResponse = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          table_id: tableId,
          items: [
            {
              menu_item_id: menuItemIds[0],
              quantity: 1,
            },
          ],
        });

      const orderId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
      expect(response.body.data.id).toBe(orderId);
    });

    it('should return 404 for non-existent order', async () => {
      const response = await request(app)
        .get('/api/v1/orders/non-existent-id')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(404);
      assertErrorResponse(response);
    });
  });

  describe('PATCH /api/v1/orders/:id/status', () => {
    it('should update order status as kitchen staff', async () => {
      // Create an order
      const createResponse = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          table_id: tableId,
          items: [
            {
              menu_item_id: menuItemIds[0],
              quantity: 1,
            },
          ],
        });

      const orderId = createResponse.body.data.id;

      // Update status
      const response = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${kitchenToken}`)
        .send({
          status: 'preparing',
        });

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
      expect(response.body.data.order_status).toBe('preparing');
    });

    it('should fail to update as customer', async () => {
      const createResponse = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          table_id: tableId,
          items: [
            {
              menu_item_id: menuItemIds[0],
              quantity: 1,
            },
          ],
        });

      const orderId = createResponse.body.data.id;

      const response = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          status: 'preparing',
        });

      expect(response.status).toBe(403);
      assertErrorResponse(response);
    });

    it('should fail with invalid status', async () => {
      const createResponse = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          table_id: tableId,
          items: [
            {
              menu_item_id: menuItemIds[0],
              quantity: 1,
            },
          ],
        });

      const orderId = createResponse.body.data.id;

      const response = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${kitchenToken}`)
        .send({
          status: 'invalid_status',
        });

      expect(response.status).toBe(400);
      assertErrorResponse(response);
    });
  });

  describe('PATCH /api/v1/orders/:id/payment', () => {
    it('should update payment status', async () => {
      const createResponse = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          table_id: tableId,
          items: [
            {
              menu_item_id: menuItemIds[0],
              quantity: 1,
            },
          ],
        });

      const orderId = createResponse.body.data.id;

      const response = await request(app)
        .patch(`/api/v1/orders/${orderId}/payment`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          payment_status: 'paid',
        });

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
      expect(response.body.data.payment_status).toBe('paid');
    });
  });
});
