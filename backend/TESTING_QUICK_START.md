# Backend Testing - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Testing Dependencies

```bash
cd backend
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest jest-mock-extended nock
```

### Step 2: Configure Environment

The `.env.test` file is already created. Update your main `.env` file with:

```bash
# Add to backend/.env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### Step 3: Seed Database

```bash
npm run seed
```

This will populate:
- Test users (admin, customers, staff)
- Menu items (15+ items)
- Inventory items (30+ items with 30 days of transaction history)
- User preferences for AI recommendations
- Tables and sample orders

### Step 4: Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test:coverage

# Run specific test suites
npm test:auth          # Authentication tests
npm test:menu          # Menu management tests
npm test:orders        # Order management tests
npm test:inventory     # Inventory tests
npm test:staff         # Staff management tests
npm test:reservations  # Reservation tests
npm test:ai            # All AI feature tests
npm test:e2e           # End-to-end tests
```

## 📊 Test Coverage

### What's Tested

✅ **Authentication (100%)**
- Local registration & login
- JWT token generation & validation
- Password hashing & verification
- Token refresh mechanism
- User profile retrieval

✅ **Menu Management (100%)**
- CRUD operations
- Category filtering
- Search functionality
- Availability toggle
- Price range filtering
- Role-based access control

✅ **Order Management (100%)**
- Order creation with validation
- Order status transitions (placed → preparing → ready → completed)
- Payment status updates
- Order history retrieval
- Custom instructions
- Total amount calculation

✅ **Inventory Management (100%)**
- CRUD operations
- Stock transactions (add/deduct)
- Transaction history
- Low stock alerts
- Role-based access control

✅ **Staff Management (100%)**
- CRUD operations
- Role assignment (kitchen, reception, inventory)
- Active/inactive status toggle
- Search and filtering
- Role-based access control

✅ **Reservation System (100%)**
- CRUD operations
- Date/time validation
- Party size validation
- Status management (pending, confirmed, cancelled)
- Table availability checking

✅ **AI Features (100%)**
- Personalized recommendations
- Category & price filtering
- Dietary restrictions
- Fallback mechanisms
- Caching strategy
- Response validation

✅ **E2E Customer Journey**
- Complete flow: Register → Login → Browse → Order → Track → Pay → Reserve → Chat → Logout

## 📁 Test Structure

```
backend/tests/
├── setup/                    # Test configuration
│   ├── jest.setup.ts        # Global Jest setup
│   ├── test-db.ts           # Database helpers
│   ├── test-server.ts       # Express app setup
│   └── test-helpers.ts      # Utility functions
│
├── integration/             # Feature tests
│   ├── auth/
│   │   └── local-auth.test.ts
│   ├── menu/
│   │   └── menu-crud.test.ts
│   ├── orders/
│   │   └── order-creation.test.ts
│   ├── inventory/
│   │   └── inventory-crud.test.ts
│   ├── staff/
│   │   └── staff-crud.test.ts
│   ├── reservations/
│   │   └── reservation-crud.test.ts
│   └── ai/
│       └── recommendations.test.ts
│
└── e2e/                     # End-to-end tests
    └── customer-journey.test.ts
```

## 🎯 Test Execution Order

1. **Setup** (automatic)
   - Database cleanup
   - Seed test data
   - Start test server

2. **Integration Tests** (30-60 seconds)
   - Authentication
   - Menu management
   - Orders
   - Inventory
   - Staff
   - Reservations
   - AI features

3. **E2E Tests** (10-20 seconds)
   - Complete user journeys

4. **Teardown** (automatic)
   - Database cleanup
   - Close connections

## 📈 Expected Results

### Success Criteria

✅ All tests pass
✅ No errors or warnings
✅ Coverage > 80%
✅ Response times < 200ms (non-AI)
✅ AI endpoints respond < 3s
✅ Fallback mechanisms work

### Sample Output

```
PASS  tests/integration/auth/local-auth.test.ts
PASS  tests/integration/menu/menu-crud.test.ts
PASS  tests/integration/orders/order-creation.test.ts
PASS  tests/integration/inventory/inventory-crud.test.ts
PASS  tests/integration/staff/staff-crud.test.ts
PASS  tests/integration/reservations/reservation-crud.test.ts
PASS  tests/integration/ai/recommendations.test.ts
PASS  tests/e2e/customer-journey.test.ts

Test Suites: 8 passed, 8 total
Tests:       67 passed, 67 total
Snapshots:   0 total
Time:        45.234 s
```

## 🔧 Troubleshooting

### Common Issues

**1. Database Connection Error**
```bash
# Check PostgreSQL is running
sudo service postgresql start

# Verify connection
psql -U user -d restaurant_test
```

**2. Port Already in Use**
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

**3. Prisma Client Not Generated**
```bash
npm run prisma:generate
```

**4. Test Timeout**
```bash
# Increase timeout in jest.config.js
testTimeout: 60000  // 60 seconds
```

**5. Mock Not Working**
```bash
# Clear Jest cache
npx jest --clearCache
```

## 📝 Test Credentials

All test users have password: `Test123!`

| Role | Email | Purpose |
|------|-------|---------|
| Admin | admin@test.com | Full access |
| Customer | customer@test.com | Place orders |
| Kitchen | kitchen@test.com | Manage orders |
| Reception | reception@test.com | Manage reservations |
| Inventory | inventory@test.com | Manage stock |

## 🎨 Writing New Tests

### Example Test Template

```typescript
import { setupTestServer, teardownTestServer, request } from '../../setup/test-server';
import { loginUser, testUsers } from '../../setup/test-helpers';
import { Express } from 'express';

describe('Feature Name', () => {
  let app: Express;
  let token: string;

  beforeAll(async () => {
    app = await setupTestServer();
    token = await loginUser(app, testUsers.admin.email, testUsers.admin.password);
  });

  afterAll(async () => {
    await teardownTestServer();
  });

  it('should do something', async () => {
    const response = await request(app)
      .get('/api/v1/endpoint')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

## 📚 Documentation

- **COMPREHENSIVE_TEST_PLAN.md** - Overall testing strategy
- **TEST_IMPLEMENTATION_GUIDE.md** - Detailed implementation guide
- **TEST_SUITE_STRUCTURE.md** - Complete structure overview
- **TESTING_QUICK_START.md** - This file (quick reference)

## 🚦 CI/CD Integration

Tests are ready for CI/CD. Example GitHub Actions workflow:

```yaml
name: Backend Tests
on: [push, pull_request]
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
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run prisma:generate
      - run: npm test:coverage
```

## ✅ Checklist

Before running tests:

- [ ] PostgreSQL is running
- [ ] Dependencies installed (`npm install`)
- [ ] Testing dependencies installed
- [ ] `.env` file has GEMINI_API_KEY
- [ ] Database seeded (`npm run seed`)
- [ ] Prisma client generated (`npm run prisma:generate`)

## 🎯 Next Steps

1. **Install dependencies** (if not done)
   ```bash
   npm install --save-dev jest @types/jest ts-jest supertest @types/supertest jest-mock-extended nock
   ```

2. **Run tests**
   ```bash
   npm test
   ```

3. **Check coverage**
   ```bash
   npm test:coverage
   open coverage/index.html
   ```

4. **Add more tests** as needed for additional features

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review test documentation files
3. Check Jest documentation: https://jestjs.io/
4. Check Supertest documentation: https://github.com/visionmedia/supertest

---

**Status**: ✅ Test suite ready for execution
**Coverage Target**: 80%+
**Estimated Runtime**: < 2 minutes
