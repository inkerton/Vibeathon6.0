import { setupTestServer, teardownTestServer, request } from '../../setup/test-server';
import { loginUser, testUsers, assertSuccessResponse, assertErrorResponse } from '../../setup/test-helpers';
import { Express } from 'express';

describe('Staff Management', () => {
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

  describe('GET /api/v1/staff', () => {
    it('should get all staff as admin', async () => {
      const response = await request(app)
        .get('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter by role', async () => {
      const response = await request(app)
        .get('/api/v1/staff?role=kitchen')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
      expect(response.body.data.every((staff: any) => staff.role === 'kitchen')).toBe(true);
    });

    it('should search by name', async () => {
      const response = await request(app)
        .get('/api/v1/staff?search=kitchen')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
    });

    it('should fail as customer', async () => {
      const response = await request(app)
        .get('/api/v1/staff')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
      assertErrorResponse(response);
    });
  });

  describe('POST /api/v1/staff', () => {
    it('should create staff member as admin', async () => {
      const response = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'newstaff@test.com',
          password: 'Staff123!',
          name: 'New Staff Member',
          role: 'kitchen',
          phone: '+1234567899',
        });

      expect(response.status).toBe(201);
      assertSuccessResponse(response);
      expect(response.body.data.email).toBe('newstaff@test.com');
      expect(response.body.data.role).toBe('kitchen');
      expect(response.body.data).not.toHaveProperty('password_hash');
    });

    it('should fail with duplicate email', async () => {
      const response = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: testUsers.kitchen.email,
          password: 'Staff123!',
          name: 'Duplicate Staff',
          role: 'kitchen',
        });

      expect(response.status).toBe(409);
      assertErrorResponse(response);
    });

    it('should fail with invalid role', async () => {
      const response = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'invalid@test.com',
          password: 'Staff123!',
          name: 'Invalid Role',
          role: 'invalid_role',
        });

      expect(response.status).toBe(400);
      assertErrorResponse(response);
    });

    it('should fail as customer', async () => {
      const response = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          email: 'unauthorized@test.com',
          password: 'Staff123!',
          name: 'Unauthorized',
          role: 'kitchen',
        });

      expect(response.status).toBe(403);
      assertErrorResponse(response);
    });
  });

  describe('PUT /api/v1/staff/:id', () => {
    it('should update staff member as admin', async () => {
      const listResponse = await request(app)
        .get('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`);
      
      const staffId = listResponse.body.data[0].id;

      const response = await request(app)
        .put(`/api/v1/staff/${staffId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name',
          phone: '+9876543210',
        });

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
      expect(response.body.data.name).toBe('Updated Name');
    });

    it('should toggle active status', async () => {
      const listResponse = await request(app)
        .get('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`);
      
      const staffId = listResponse.body.data[0].id;
      const currentStatus = listResponse.body.data[0].is_active;

      const response = await request(app)
        .put(`/api/v1/staff/${staffId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          is_active: !currentStatus,
        });

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
      expect(response.body.data.is_active).toBe(!currentStatus);
    });
  });

  describe('DELETE /api/v1/staff/:id', () => {
    it('should delete staff member as admin', async () => {
      // Create staff to delete
      const createResponse = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'todelete@test.com',
          password: 'Staff123!',
          name: 'To Delete',
          role: 'kitchen',
        });

      const staffId = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/v1/staff/${staffId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
    });
  });
});
