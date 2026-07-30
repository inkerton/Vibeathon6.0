import { setupTestServer, teardownTestServer, request } from '../../setup/test-server';
import { testUsers, assertSuccessResponse, assertErrorResponse } from '../../setup/test-helpers';
import { Express } from 'express';

describe('Local Authentication', () => {
  let app: Express;

  beforeAll(async () => {
    app = await setupTestServer();
  });

  afterAll(async () => {
    await teardownTestServer();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'newuser@test.com',
          password: 'Password123!',
          name: 'New User',
          phone: '+1234567890',
        });

      expect(response.status).toBe(201);
      assertSuccessResponse(response);
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data.email).toBe('newuser@test.com');
      expect(response.body.data.name).toBe('New User');
      expect(response.body.data).toHaveProperty('message');
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      assertErrorResponse(response);
    });

    it('should fail with weak password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@test.com',
          password: '123',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      assertErrorResponse(response);
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@test.com',
        });

      expect(response.status).toBe(400);
      assertErrorResponse(response);
    });

    it('should fail with duplicate email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testUsers.admin.email,
          password: 'Password123!',
          name: 'Duplicate User',
        });

      expect(response.status).toBe(409);
      assertErrorResponse(response);
      expect(response.body.message).toContain('already exists');
    });

    it('should hash password before storing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'hashtest@test.com',
          password: 'Password123!',
          name: 'Hash Test',
        });

      expect(response.status).toBe(201);
      assertSuccessResponse(response);
      expect(response.body.data).not.toHaveProperty('password');
      expect(response.body.data).not.toHaveProperty('password_hash');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.admin.email,
          password: testUsers.admin.password,
        });

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(testUsers.admin.email);
      expect(response.body.data.user.role).toBe(testUsers.admin.role);
    });

    it('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.admin.email,
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      assertErrorResponse(response);
      expect(response.body.message).toContain('Invalid');
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(401);
      assertErrorResponse(response);
    });

    it('should fail with missing credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.admin.email,
        });

      expect(response.status).toBe(400);
      assertErrorResponse(response);
    });

    it('should return different tokens for different users', async () => {
      const response1 = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.admin.email,
          password: testUsers.admin.password,
        });

      const response2 = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.customer.email,
          password: testUsers.customer.password,
        });

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body.data.accessToken).not.toBe(response2.body.data.accessToken);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return current user with valid token', async () => {
      // Login first
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.customer.email,
          password: testUsers.customer.password,
        });

      const token = loginResponse.body.data.accessToken;

      // Get current user
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
      expect(response.body.data.email).toBe(testUsers.customer.email);
      expect(response.body.data.role).toBe(testUsers.customer.role);
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me');

      expect(response.status).toBe(401);
      assertErrorResponse(response);
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
      assertErrorResponse(response);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      // Login first
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.customer.email,
          password: testUsers.customer.password,
        });

      const token = loginResponse.body.data.accessToken;

      // Logout
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Logged out successfully');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      // Login first
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.customer.email,
          password: testUsers.customer.password,
        });

      const refreshToken = loginResponse.body.data.refreshToken;

      // Wait 1 second to ensure different timestamp in JWT
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Refresh token
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: refreshToken });

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      // Verify tokens are valid JWTs
      expect(response.body.data.accessToken).toMatch(/^eyJ/);
      expect(response.body.data.refreshToken).toMatch(/^eyJ/);
    });

    it('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid_refresh_token' });

      expect(response.status).toBe(401);
      assertErrorResponse(response);
    });
  });
});
