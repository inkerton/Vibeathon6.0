import { setupTestServer, teardownTestServer, request } from '../setup/test-server';
import { testUsers, assertSuccessResponse } from '../setup/test-helpers';
import { Express } from 'express';
import { prisma } from '../setup/test-db';

describe('E2E: Customer Journey', () => {
  let app: Express;
  let accessToken: string;
  let customerId: string;
  let tableId: string;
  let menuItemIds: string[] = [];
  let orderId: string;

  beforeAll(async () => {
    app = await setupTestServer();
    
    const tables = await prisma.table.findMany();
    tableId = tables[0].id;
    
    const menuItems = await prisma.menuItem.findMany({ take: 3 });
    menuItemIds = menuItems.map(item => item.id);
  });

  afterAll(async () => {
    await teardownTestServer();
  });

  it('Complete customer journey: Register → Login → Browse → Order → Track → Pay', async () => {
    // Step 1: Register new customer
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'journey@test.com',
        password: 'Journey123!',
        name: 'Journey Customer',
        phone: '+1234567890',
      });

    expect(registerResponse.status).toBe(201);
    assertSuccessResponse(registerResponse);
    customerId = registerResponse.body.data.user.id;

    // Step 2: Login
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'journey@test.com',
        password: 'Journey123!',
      });

    expect(loginResponse.status).toBe(200);
    assertSuccessResponse(loginResponse);
    accessToken = loginResponse.body.data.access_token;

    // Step 3: Browse menu
    const menuResponse = await request(app)
      .get('/api/v1/menu');

    expect(menuResponse.status).toBe(200);
    assertSuccessResponse(menuResponse);
    expect(menuResponse.body.data.length).toBeGreaterThan(0);

    // Step 4: Get AI recommendations
    const recommendationsResponse = await request(app)
      .get(`/api/v1/ai/recommendations/${customerId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(recommendationsResponse.status).toBe(200);
    assertSuccessResponse(recommendationsResponse);

    // Step 5: Place order
    const orderResponse = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        table_id: tableId,
        items: [
          {
            menu_item_id: menuItemIds[0],
            quantity: 2,
            custom_instructions: 'Extra sauce',
          },
          {
            menu_item_id: menuItemIds[1],
            quantity: 1,
          },
        ],
      });

    expect(orderResponse.status).toBe(201);
    assertSuccessResponse(orderResponse);
    orderId = orderResponse.body.data.id;
    expect(orderResponse.body.data.order_status).toBe('placed');

    // Step 6: Track order
    const trackResponse = await request(app)
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(trackResponse.status).toBe(200);
    assertSuccessResponse(trackResponse);
    expect(trackResponse.body.data.id).toBe(orderId);

    // Step 7: Get order history
    const historyResponse = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(historyResponse.status).toBe(200);
    assertSuccessResponse(historyResponse);
    expect(historyResponse.body.data.some((order: any) => order.id === orderId)).toBe(true);

    // Step 8: Update payment status
    const paymentResponse = await request(app)
      .patch(`/api/v1/orders/${orderId}/payment`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        payment_status: 'paid',
      });

    expect(paymentResponse.status).toBe(200);
    assertSuccessResponse(paymentResponse);
    expect(paymentResponse.body.data.payment_status).toBe('paid');

    // Step 9: Make a reservation for next visit
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    futureDate.setHours(19, 0, 0, 0);

    const reservationResponse = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        table_id: tableId,
        date: futureDate.toISOString(),
        party_size: 4,
        special_request: 'Birthday celebration',
      });

    expect(reservationResponse.status).toBe(201);
    assertSuccessResponse(reservationResponse);

    // Step 10: Chat with AI assistant
    const chatResponse = await request(app)
      .post('/api/v1/ai/chatbot/chat')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        message: 'What are your most popular dishes?',
      });

    expect(chatResponse.status).toBe(200);
    assertSuccessResponse(chatResponse);

    // Step 11: Logout
    const logoutResponse = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(logoutResponse.status).toBe(200);
    assertSuccessResponse(logoutResponse);
  });
});
