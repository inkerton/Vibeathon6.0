/// <reference types="jest" />
import { PrismaClient } from '@prisma/client';

// Increase timeout for AI tests
jest.setTimeout(30000);

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error, // Keep error for debugging
};

// Global test cleanup
afterAll(async () => {
  const prisma = new PrismaClient();
  await prisma.$disconnect();
});

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
