# Backend Test Suite Implementation Guide

## Quick Start

### 1. Install Testing Dependencies

```bash
cd backend
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest jest-mock-extended nock
```

### 2. Create Test Configuration

Create `jest.config.js`:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],
  testTimeout: 30000,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

Create `jest.setup.ts`:
```typescript
// tests/setup/jest.setup.ts
import { PrismaClient } from '@prisma/client';

// Increase timeout for AI tests
jest.setTimeout(30000);

// Mock console methods to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
};

// Global test cleanup
afterAll(async () => {
  const prisma = new PrismaClient();
  await prisma.$disconnect();
});
```

### 3. Update package.json

Add test scripts:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:e2e": "jest tests/e2e",
    "test:auth": "jest tests/integration/auth",
    "test:ai": "jest tests/integration/ai"
  }
}
```

### 4. Create Test Environment File

Create `.env.test`:
```env
NODE_ENV=test
PORT=3001
DATABASE_URL="postgresql://user:password@localhost:5432/restaurant_test?schema=public"
JWT_SECRET=test_jwt_secret_key_for_testing_only
JWT_REFRESH_SECRET=test_refresh_secret_key_for_testing_only
GEMINI_API_KEY=test_gemini_key
GEMINI_MODEL=gemini-1.5-flash
GOOGLE_CLIENT_ID=test_google_client_id
GOOGLE_CLIENT_SECRET=test_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/v1/auth/google/callback
EMAIL_HOST=smtp.test.com
EMAIL_PORT=587
EMAIL_USER=test@test.com
EMAIL_PASSWORD=test_password
FRONTEND_URL=http://localhost:3000
```

## Test Structure Implementation

### Setup Files

#### 1. Test Database Helper (`tests/setup/test-db.ts`)

```typescript
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

export async function setupTestDatabase() {
  // Reset database
  await prisma.$executeRawUnsafe('DROP SCHEMA public CASCADE');
  await prisma.$executeRawUnsafe('CREATE SCHEMA public');
  
  // Run migrations
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  
  // Seed test data
  await seedTestData();
}

export async function cleanupTestDatabase() {
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
    }
  }
}

async function seedTestData() {
  // Create test users
  const bcrypt = require('bcrypt');
  
  await prisma.user.createMany({
    data: [
      {
        email: 'admin@test.com',
        password_hash: await bcrypt.hash('Admin123!', 10),
        name: 'Test Admin',
        role: 'admin',
        is_active: true,
        auth_provider: 'local',
      },
      {
        email: 'customer@test.com',
        password_hash: await bcrypt.hash('Customer123!', 10),
        name: 'Test Customer',
        role: 'customer',
        is_active: true,
        auth_provider: 'local',
      },
      {
        email: 'kitchen@test.com',
        password_hash: await bcrypt.hash('Kitchen123!', 10),
        name: 'Test Kitchen',
        role: 'kitchen',
        is_active: true,
        auth_provider: 'local',
      },
    ],
  });

  // Create test menu items
  await prisma.menuItem.createMany({
    data: [
      {
        name: 'Test Burger',
        description: 'Test burger description',
        price: 15.99,
        category: 'main_course',
        is_available: true,
        preparation_time: 15,
      },
      {
        name: 'Test Pizza',
        description: 'Test pizza description',
        price: 18.99,
        category: 'main_course',
        is_available: true,
        preparation_time: 20,
      },
    ],
  });
}

export { prisma };
```

#### 2. Test Server Helper (`tests/setup/test-server.ts`)

```typescript
import express, { Express } from 'express';
import request from 'supertest';
import { setupTestDatabase, cleanupTestDatabase } from './test-db';

let app: Express;

export async function setupTestServer(): Promise<Express> {
  await setupTestDatabase();
  
  // Import your app setup
  const { createApp } = require('../../src/index');
  app = createApp();
  
  return app;
}

export async function teardownTestServer() {
  await cleanupTestDatabase();
}

export function getTestApp(): Express {
  return app;
}

export { request };
```

#### 3. Test Helpers (`tests/setup/test-helpers.ts`)

```typescript
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

export function generateTestToken(user: Partial<User>): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'test_secret',
    { expiresIn: '1h' }
  );
}

export function mockGeminiResponse(response: any) {
  return {
    response: {
      text: () => JSON.stringify(response),
    },
  };
}

export const testUsers = {
  admin: {
    email: 'admin@test.com',
    password: 'Admin123!',
    role: 'admin',
  },
  customer: {
    email: 'customer@test.com',
    password: 'Customer123!',
    role: 'customer',
  },
  kitchen: {
    email: 'kitchen@test.com',
    password: 'Kitchen123!',
    role: 'kitchen',
  },
};

export async function loginUser(app: any, email: string, password: string) {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  
  return response.body.data.access_token;
}
```

### Example Test Files

#### Authentication Tests (`tests/integration/auth/local-auth.test.ts`)

```typescript
import { setupTestServer, teardownTestServer, request } from '../../setup/test-server';
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
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe('newuser@test.com');
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
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
      expect(response.body.success).toBe(false);
    });

    it('should fail with duplicate email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'admin@test.com',
          password: 'Password123!',
          name: 'Duplicate User',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'Admin123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('access_token');
      expect(response.body.data).toHaveProperty('refresh_token');
    });

    it('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'WrongPassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
```

#### Menu Tests (`tests/integration/menu/menu-crud.test.ts`)

```typescript
import { setupTestServer, teardownTestServer, request } from '../../setup/test-server';
import { loginUser, testUsers } from '../../setup/test-helpers';
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
    it('should get all menu items', async () => {
      const response = await request(app)
        .get('/api/v1/menu')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/v1/menu?category=main_course')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((item: any) => item.category === 'main_course')).toBe(true);
    });

    it('should filter by availability', async () => {
      const response = await request(app)
        .get('/api/v1/menu?available=true')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((item: any) => item.is_available === true)).toBe(true);
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
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Test Item');
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
    });
  });

  describe('PUT /api/v1/menu/:id', () => {
    it('should update menu item as admin', async () => {
      // First get an item
      const getResponse = await request(app)
        .get('/api/v1/menu')
        .set('Authorization', `Bearer ${adminToken}`);
      
      const itemId = getResponse.body.data[0].id;

      const response = await request(app)
        .put(`/api/v1/menu/${itemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          price: 19.99,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.price).toBe(19.99);
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
    });
  });
});
```

#### AI Recommendation Tests (`tests/integration/ai/recommendations.test.ts`)

```typescript
import { setupTestServer, teardownTestServer, request } from '../../setup/test-server';
import { loginUser, testUsers, mockGeminiResponse } from '../../setup/test-helpers';
import { Express } from 'express';
import nock from 'nock';

describe('AI Recommendations', () => {
  let app: Express;
  let customerToken: string;
  let userId: string;

  beforeAll(async () => {
    app = await setupTestServer();
    customerToken = await loginUser(app, testUsers.customer.email, testUsers.customer.password);
    
    // Get user ID
    const userResponse = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${customerToken}`);
    userId = userResponse.body.data.id;
  });

  afterAll(async () => {
    await teardownTestServer();
  });

  beforeEach(() => {
    // Mock Gemini API
    nock('https://generativelanguage.googleapis.com')
      .post(/.*/)
      .reply(200, mockGeminiResponse({
        recommendations: [
          {
            item_id: 'test-id-1',
            name: 'Recommended Burger',
            score: 0.95,
            reason: 'Based on your preferences',
          },
        ],
      }));
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('GET /api/v1/ai/recommendations/:userId', () => {
    it('should get personalized recommendations', async () => {
      const response = await request(app)
        .get(`/api/v1/ai/recommendations/${userId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.recommendations)).toBe(true);
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get(`/api/v1/ai/recommendations/${userId}?category=main_course`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.filters.category).toBe('main_course');
    });

    it('should filter by price range', async () => {
      const response = await request(app)
        .get(`/api/v1/ai/recommendations/${userId}?minPrice=10&maxPrice=20`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.filters.priceRange).toEqual({ min: 10, max: 20 });
    });

    it('should use fallback when AI fails', async () => {
      // Mock AI failure
      nock.cleanAll();
      nock('https://generativelanguage.googleapis.com')
        .post(/.*/)
        .replyWithError('AI service unavailable');

      const response = await request(app)
        .get(`/api/v1/ai/recommendations/${userId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.fallback).toBe(true);
    });
  });
});
```

## Test Execution Guide

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test:coverage

# Run specific test suites
npm test:unit          # Unit tests only
npm test:integration   # Integration tests only
npm test:e2e          # E2E tests only

# Run specific feature tests
npm test:auth         # Authentication tests
npm test:ai           # AI feature tests

# Watch mode for development
npm test:watch

# Run single test file
npm test -- tests/integration/auth/local-auth.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should login"
```

### Test Order

Tests should be run in this order for best results:

1. **Unit Tests** - Fast, isolated tests
2. **Integration Tests** - Feature-specific tests
3. **E2E Tests** - Full user journey tests

### Debugging Tests

```bash
# Run with verbose output
npm test -- --verbose

# Run with debug logs
DEBUG=* npm test

# Run single test in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand tests/path/to/test.ts
```

## Coverage Reports

After running `npm test:coverage`, view reports:

```bash
# Open HTML coverage report
open coverage/index.html

# View text summary
cat coverage/coverage-summary.txt
```

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/test.yml`:

```yaml
name: Backend Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: restaurant_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      
      - name: Install dependencies
        working-directory: backend
        run: npm ci
      
      - name: Generate Prisma Client
        working-directory: backend
        run: npm run prisma:generate
      
      - name: Run migrations
        working-directory: backend
        run: npm run prisma:migrate
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/restaurant_test
      
      - name: Run tests
        working-directory: backend
        run: npm test:coverage
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/restaurant_test
          JWT_SECRET: test_secret
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info
          flags: backend
```

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Clean up after each test
- Don't rely on test execution order

### 2. Descriptive Names
```typescript
// Good
it('should return 401 when token is expired')

// Bad
it('test login')
```

### 3. Arrange-Act-Assert Pattern
```typescript
it('should create order successfully', async () => {
  // Arrange
  const orderData = { items: [...], table_id: 1 };
  
  // Act
  const response = await request(app)
    .post('/api/v1/orders')
    .send(orderData);
  
  // Assert
  expect(response.status).toBe(201);
  expect(response.body.data).toHaveProperty('id');
});
```

### 4. Mock External Services
- Always mock Gemini AI
- Mock email service
- Mock OAuth providers
- Use nock for HTTP mocks

### 5. Test Edge Cases
- Empty inputs
- Invalid data types
- Boundary values
- Error conditions

## Troubleshooting

### Common Issues

**Database Connection Errors**
```bash
# Ensure PostgreSQL is running
sudo service postgresql start

# Check connection
psql -U test -d restaurant_test
```

**Port Already in Use**
```bash
# Kill process on port
lsof -ti:3001 | xargs kill -9
```

**Prisma Client Not Generated**
```bash
npm run prisma:generate
```

**Test Timeouts**
```typescript
// Increase timeout for specific test
it('slow test', async () => {
  // test code
}, 60000); // 60 second timeout
```

## Next Steps

1. ✅ Install dependencies
2. ✅ Create configuration files
3. ✅ Set up test helpers
4. 🔄 Write unit tests
5. 🔄 Write integration tests
6. 🔄 Write E2E tests
7. 🔄 Configure CI/CD
8. 🔄 Generate coverage reports

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [Testing Best Practices](https://testingjavascript.com/)
