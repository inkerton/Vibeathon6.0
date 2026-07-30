import express, { Express } from 'express';
import request from 'supertest';
import { setupTestDatabase, cleanupTestDatabase, prisma } from './test-db';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

let app: Express;

/**
 * Create and configure Express app for testing
 */
function createTestApp(): Express {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Import routes
  const authRoutes = require('../../src/routes/auth.routes');
  const menuRoutes = require('../../src/routes/menu.routes');
  const orderRoutes = require('../../src/routes/order.routes');
  const inventoryRoutes = require('../../src/routes/inventory.routes');
  const staffRoutes = require('../../src/routes/staff.routes');
  const reservationRoutes = require('../../src/routes/reservation.routes');
  const aiRoutes = require('../../src/routes/ai.routes');

  // Register routes
  app.use('/api/v1/auth', authRoutes.default || authRoutes);
  app.use('/api/v1/menu', menuRoutes.default || menuRoutes);
  app.use('/api/v1/orders', orderRoutes.default || orderRoutes);
  app.use('/api/v1/inventory', inventoryRoutes.default || inventoryRoutes);
  app.use('/api/v1/staff', staffRoutes.default || staffRoutes);
  app.use('/api/v1/reservations', reservationRoutes.default || reservationRoutes);
  app.use('/api/v1/ai', aiRoutes.default || aiRoutes);

  // Error handler - must match production format
  const { errorHandler } = require('../../src/middleware/error-handler');
  app.use(errorHandler);

  return app;
}

/**
 * Setup test server and database
 */
export async function setupTestServer(): Promise<Express> {
  await setupTestDatabase();
  app = createTestApp();
  return app;
}

/**
 * Teardown test server and database
 */
export async function teardownTestServer(): Promise<void> {
  await cleanupTestDatabase();
  await prisma.$disconnect();
}

/**
 * Get the test app instance
 */
export function getTestApp(): Express {
  if (!app) {
    throw new Error('Test app not initialized. Call setupTestServer() first.');
  }
  return app;
}

// Export request for convenience
export { request };
