import { setupTestServer, teardownTestServer, request } from '../../setup/test-server';
import { loginUser, testUsers, assertSuccessResponse, assertErrorResponse } from '../../setup/test-helpers';
import { Express } from 'express';
import nock from 'nock';

describe('AI Recommendations', () => {
  let app: Express;
  let customerToken: string;
  let adminToken: string;
  let customerId: string;

  beforeAll(async () => {
    app = await setupTestServer();
    customerToken = await loginUser(app, testUsers.customer.email, testUsers.customer.password);
    adminToken = await loginUser(app, testUsers.admin.email, testUsers.admin.password);
    
    // Get customer ID
    const userResponse = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${customerToken}`);
    customerId = userResponse.body.data.id;
  });

  afterAll(async () => {
    await teardownTestServer();
  });

  beforeEach(() => {
    // Mock Gemini API for each test
    nock('https://generativelanguage.googleapis.com')
      .post(/.*/)
      .reply(200, {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                recommendations: [
                  {
                    item_id: 'test-id-1',
                    name: 'Recommended Burger',
                    score: 0.95,
                    reason: 'Based on your previous orders and preferences',
                  },
                  {
                    item_id: 'test-id-2',
                    name: 'Recommended Pizza',
                    score: 0.88,
                    reason: 'Popular among customers with similar tastes',
                  },
                ],
              }),
            }],
          },
        }],
      });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('GET /api/v1/ai/recommendations/:userId', () => {
    it('should get personalized recommendations', async () => {
      const response = await request(app)
        .get(`/api/v1/ai/recommendations/${customerId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
      expect(response.body.data).toHaveProperty('recommendations');
      expect(Array.isArray(response.body.data.recommendations)).toBe(true);
      expect(response.body.data.recommendations.length).toBeGreaterThan(0);
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get(`/api/v1/ai/recommendations/${customerId}?category=main_course`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
      expect(response.body.data.filters).toHaveProperty('category');
      expect(response.body.data.filters.category).toBe('main_course');
    });

    it('should filter by price range', async () => {
      const response = await request(app)
        .get(`/api/v1/ai/recommendations/${customerId}?minPrice=10&maxPrice=20`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
      expect(response.body.data.filters).toHaveProperty('priceRange');
      expect(response.body.data.filters.priceRange.min).toBe(10);
      expect(response.body.data.filters.priceRange.max).toBe(20);
    });

    it('should filter by dietary restrictions', async () => {
      const response = await request(app)
        .get(`/api/v1/ai/recommendations/${customerId}?dietary=vegetarian`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
      expect(response.body.data.filters).toHaveProperty('dietary');
    });

    it('should use fallback when AI fails', async () => {
      // Mock AI failure
      nock.cleanAll();
      nock('https://generativelanguage.googleapis.com')
        .post(/.*/)
        .replyWithError('AI service unavailable');

      const response = await request(app)
        .get(`/api/v1/ai/recommendations/${customerId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
      expect(response.body.data).toHaveProperty('fallback');
      expect(response.body.data.fallback).toBe(true);
      expect(Array.isArray(response.body.data.recommendations)).toBe(true);
    });

    it('should cache recommendations', async () => {
      // First request
      const response1 = await request(app)
        .get(`/api/v1/ai/recommendations/${customerId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response1.status).toBe(200);

      // Second request should use cache
      const response2 = await request(app)
        .get(`/api/v1/ai/recommendations/${customerId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response2.status).toBe(200);
      expect(response2.body.data).toHaveProperty('cached');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/v1/ai/recommendations/${customerId}`);

      expect(response.status).toBe(401);
      assertErrorResponse(response);
    });

    it('should fail for non-existent user', async () => {
      const response = await request(app)
        .get('/api/v1/ai/recommendations/non-existent-user-id')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(404);
      assertErrorResponse(response);
    });

    it('should include recommendation metadata', async () => {
      const response = await request(app)
        .get(`/api/v1/ai/recommendations/${customerId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('user_id');
      expect(response.body.data.user_id).toBe(customerId);
    });
  });

  describe('POST /api/v1/ai/recommendations/:userId/feedback', () => {
    it('should accept positive feedback', async () => {
      const response = await request(app)
        .post(`/api/v1/ai/recommendations/${customerId}/feedback`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          recommendation_id: 'test-rec-id',
          feedback: 'positive',
          item_ordered: true,
        });

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
    });

    it('should accept negative feedback', async () => {
      const response = await request(app)
        .post(`/api/v1/ai/recommendations/${customerId}/feedback`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          recommendation_id: 'test-rec-id',
          feedback: 'negative',
          reason: 'Not interested in this type of food',
        });

      expect(response.status).toBe(200);
      assertSuccessResponse(response);
    });

    it('should fail with invalid feedback type', async () => {
      const response = await request(app)
        .post(`/api/v1/ai/recommendations/${customerId}/feedback`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          recommendation_id: 'test-rec-id',
          feedback: 'invalid',
        });

      expect(response.status).toBe(400);
      assertErrorResponse(response);
    });
  });
});
