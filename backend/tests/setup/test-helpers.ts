import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import request from 'supertest';
import { Express } from 'express';

/**
 * Generate a test JWT token for a user
 */
export function generateTestToken(user: Partial<User>): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET || 'test_jwt_secret_key_for_testing_only',
    { expiresIn: '1h' }
  );
}

/**
 * Generate a refresh token for testing
 */
export function generateTestRefreshToken(user: Partial<User>): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email 
    },
    process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_key_for_testing_only',
    { expiresIn: '7d' }
  );
}

/**
 * Mock Gemini AI response
 */
export function mockGeminiResponse(response: any) {
  return {
    response: {
      text: () => JSON.stringify(response),
    },
  };
}

/**
 * Test user credentials
 */
export const testUsers = {
  admin: {
    email: 'admin@test.com',
    password: 'Test123!',
    role: 'admin',
  },
  customer: {
    email: 'customer@test.com',
    password: 'Test123!',
    role: 'customer',
  },
  kitchen: {
    email: 'kitchen@test.com',
    password: 'Test123!',
    role: 'kitchen',
  },
  reception: {
    email: 'reception@test.com',
    password: 'Test123!',
    role: 'reception',
  },
  inventory: {
    email: 'inventory@test.com',
    password: 'Test123!',
    role: 'inventory',
  },
};

/**
 * Login a user and return the access token
 */
export async function loginUser(
  app: Express, 
  email: string, 
  password: string
): Promise<string> {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  
  if (response.status !== 200) {
    throw new Error(`Login failed: ${response.body.message}`);
  }
  
  return response.body.data.accessToken;
}

/**
 * Login and get both access and refresh tokens
 */
export async function loginUserWithTokens(
  app: Express, 
  email: string, 
  password: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  
  if (response.status !== 200) {
    throw new Error(`Login failed: ${response.body.message}`);
  }
  
  return {
    accessToken: response.body.data.accessToken,
    refreshToken: response.body.data.refreshToken,
  };
}

/**
 * Create a test menu item
 */
export async function createTestMenuItem(
  app: Express,
  token: string,
  data: {
    name: string;
    description: string;
    price: number;
    category: string;
    preparation_time?: number;
  }
) {
  const response = await request(app)
    .post('/api/v1/menu')
    .set('Authorization', `Bearer ${token}`)
    .send(data);
  
  return response.body.data;
}

/**
 * Create a test order
 */
export async function createTestOrder(
  app: Express,
  token: string,
  data: {
    table_id: string;
    items: Array<{
      menu_item_id: string;
      quantity: number;
      custom_instructions?: string;
    }>;
  }
) {
  const response = await request(app)
    .post('/api/v1/orders')
    .set('Authorization', `Bearer ${token}`)
    .send(data);
  
  return response.body.data;
}

/**
 * Create a test reservation
 */
export async function createTestReservation(
  app: Express,
  token: string,
  data: {
    table_id: string;
    date: Date;
    party_size: number;
    special_request?: string;
  }
) {
  const response = await request(app)
    .post('/api/v1/reservations')
    .set('Authorization', `Bearer ${token}`)
    .send(data);
  
  return response.body.data;
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error('Timeout waiting for condition');
}

/**
 * Mock email service
 */
export const mockEmailService = {
  sendEmail: jest.fn().mockResolvedValue(true),
  sendOTP: jest.fn().mockResolvedValue(true),
  sendPasswordReset: jest.fn().mockResolvedValue(true),
};

/**
 * Mock Gemini AI service
 */
export const mockGeminiService = {
  generateContent: jest.fn().mockResolvedValue(mockGeminiResponse({
    recommendations: [],
    predictions: [],
    insights: [],
  })),
};

/**
 * Test data generators
 */
export const testDataGenerators = {
  /**
   * Generate random email
   */
  randomEmail: () => `test${Date.now()}${Math.random()}@test.com`,
  
  /**
   * Generate random phone
   */
  randomPhone: () => `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
  
  /**
   * Generate random menu item
   */
  randomMenuItem: () => ({
    name: `Test Item ${Date.now()}`,
    description: 'Test description',
    price: Math.random() * 20 + 5,
    category: ['appetizers', 'main_course', 'desserts', 'beverages'][
      Math.floor(Math.random() * 4)
    ],
    preparation_time: Math.floor(Math.random() * 30 + 5),
  }),
  
  /**
   * Generate future date
   */
  futureDate: (daysFromNow: number = 1) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date;
  },
};

/**
 * Assert response structure
 */
export function assertSuccessResponse(response: any) {
  expect(response.body).toHaveProperty('status');
  expect(response.body.status).toBe('success');
  expect(response.body).toHaveProperty('data');
}

export function assertErrorResponse(response: any) {
  expect(response.body).toHaveProperty('status');
  expect(response.body.status).toBe('error');
  expect(response.body).toHaveProperty('message');
}

/**
 * Clean up test data
 */
export async function cleanupTestData(prisma: any) {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.recipeItem.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.aIInsight.deleteMany();
  await prisma.demandForecast.deleteMany();
  await prisma.inventoryPrediction.deleteMany();
  await prisma.aIRecommendation.deleteMany();
  await prisma.userPreference.deleteMany();
}
