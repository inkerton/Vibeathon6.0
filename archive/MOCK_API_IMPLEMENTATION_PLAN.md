# Mock API Layer Implementation Plan
## Frontend Testing & Development Without Backend

**Created:** 2026-07-26 08:27 IST  
**Purpose:** Enable independent frontend testing and development with mock data  
**Estimated Time:** 2-3 hours

---

## 🎯 Objectives

1. **Enable Frontend Testing** - Test all UI flows without backend
2. **Parallel Development** - Frontend and backend teams can work independently
3. **Faster Iteration** - No need to wait for backend fixes
4. **Demo Mode** - Show UI/UX without live backend
5. **Consistent Test Data** - Predictable data for testing edge cases

---

## 📋 Implementation Strategy

### Phase 1: Mock Data Structure (30 minutes)

#### 1.1 Create Mock Data Files
**Location:** `frontend/lib/mock-data/`

```
frontend/lib/mock-data/
├── index.ts              # Export all mock data
├── users.ts              # Mock users (all roles)
├── menu.ts               # Mock menu items
├── orders.ts             # Mock orders (various states)
├── reservations.ts       # Mock reservations
├── inventory.ts          # Mock inventory items
├── recipes.ts            # Mock recipes
├── staff.ts              # Mock staff members
└── transactions.ts       # Mock inventory transactions
```

#### 1.2 Mock Data Requirements

**Users (users.ts)**
```typescript
// Admin user
{
  id: 'admin-1',
  email: 'admin@restaurant.com',
  name: 'Admin User',
  role: 'admin',
  isActive: true
}

// Customer user
{
  id: 'customer-1',
  email: 'customer@example.com',
  name: 'John Doe',
  role: 'customer',
  isActive: true
}

// Kitchen staff
{
  id: 'kitchen-1',
  email: 'chef@restaurant.com',
  name: 'Chef Mario',
  role: 'kitchen',
  isActive: true
}

// Inventory staff
{
  id: 'inventory-1',
  email: 'inventory@restaurant.com',
  name: 'Stock Manager',
  role: 'inventory',
  isActive: true
}

// Reception staff
{
  id: 'reception-1',
  email: 'reception@restaurant.com',
  name: 'Front Desk',
  role: 'reception',
  isActive: true
}
```

**Menu Items (menu.ts)**
```typescript
// 20+ items across all categories
- Starters (5 items)
- Main Course (8 items)
- Desserts (4 items)
- Beverages (5 items)

// Include:
- Available items
- Unavailable items
- Items with different price ranges
- Items with images (placeholder URLs)
```

**Orders (orders.ts)**
```typescript
// Various order states
- Placed (2 orders)
- Preparing (3 orders)
- Ready (2 orders)
- Completed (5 orders)
- Cancelled (1 order)

// Include:
- Different table numbers
- Different item counts
- Custom instructions
- Allergy information
- Payment statuses (paid, pending)
- Different timestamps
```

**Reservations (reservations.ts)**
```typescript
// Various reservation states
- Pending (3 reservations)
- Confirmed (4 reservations)
- Checked In (2 reservations)
- Completed (3 reservations)
- Cancelled (1 reservation)

// Include:
- Different dates/times
- Different party sizes
- Different table numbers
- Special requests
```

**Inventory Items (inventory.ts)**
```typescript
// 15+ inventory items
- Low stock items (3)
- Out of stock items (2)
- Normal stock items (10)

// Include:
- Different units (kg, liters, pieces)
- Different categories
- Reserved stock amounts
- Reorder thresholds
```

**Recipes (recipes.ts)**
```typescript
// Link menu items to ingredients
- Pizza Margherita → [Dough, Tomato Sauce, Mozzarella, Basil]
- Pasta Carbonara → [Pasta, Eggs, Bacon, Parmesan]
- Caesar Salad → [Lettuce, Croutons, Parmesan, Dressing]

// Include quantities per serving
```

**Staff Members (staff.ts)**
```typescript
// 10+ staff members
- Admins (2)
- Kitchen staff (3)
- Inventory staff (2)
- Reception staff (3)

// Include active and inactive staff
```

**Transactions (transactions.ts)**
```typescript
// 20+ transactions
- Restock transactions
- Deduction transactions
- Adjustment transactions
- Reservation transactions

// Include timestamps, reasons, quantities
```

---

### Phase 2: Mock API Client (45 minutes)

#### 2.1 Create Mock API Client
**Location:** `frontend/lib/mock-api-client.ts`

**Features:**
- Simulate API delays (200-500ms)
- Return mock data based on endpoint
- Handle authentication (mock tokens)
- Simulate errors (optional)
- Support all existing API endpoints

**Structure:**
```typescript
class MockApiClient {
  private delay = 300; // Simulate network delay
  private mockToken = 'mock-jwt-token';
  
  // Auth endpoints
  async login(email: string, password: string)
  async register(data: any)
  async verifyOtp(email: string, otp: string)
  async getMe()
  
  // Menu endpoints
  async getMenu()
  async getMenuById(id: string)
  async createMenuItem(data: any)
  async updateMenuItem(id: string, data: any)
  async deleteMenuItem(id: string)
  
  // Order endpoints
  async createOrder(data: any)
  async getMyOrders()
  async getAllOrders()
  async getActiveOrders()
  async getOrderById(id: string)
  async updateOrderStatus(id: string, status: string)
  async updateOrderItemStatus(orderId: string, itemId: string, status: string)
  
  // Reservation endpoints
  async getAvailableTables(date: string, time: string, partySize: number)
  async createReservation(data: any)
  async getMyReservations()
  async getAllReservations()
  async updateReservationStatus(id: string, status: string)
  async cancelReservation(id: string)
  
  // Inventory endpoints
  async getInventory()
  async getLowStockItems()
  async getInventoryTransactions()
  async restockItem(id: string, data: any)
  async adjustStock(id: string, data: any)
  
  // Recipe endpoints
  async getRecipeByMenuItemId(menuItemId: string)
  async addIngredientToRecipe(menuItemId: string, data: any)
  async updateRecipeIngredient(recipeItemId: string, data: any)
  async removeIngredientFromRecipe(recipeItemId: string)
  
  // Staff endpoints
  async getStaff()
  async createStaff(data: any)
  async updateStaff(id: string, data: any)
  async deactivateStaff(id: string)
  
  // Helper methods
  private async simulateDelay()
  private generateId()
  private getCurrentUser()
}
```

#### 2.2 Mock State Management
**Location:** `frontend/lib/mock-state.ts`

**Purpose:** Maintain state across mock API calls

```typescript
class MockState {
  private users: User[] = mockUsers;
  private menuItems: MenuItem[] = mockMenuItems;
  private orders: Order[] = mockOrders;
  private reservations: Reservation[] = mockReservations;
  private inventory: InventoryItem[] = mockInventory;
  private recipes: Recipe[] = mockRecipes;
  private staff: Staff[] = mockStaff;
  private transactions: Transaction[] = mockTransactions;
  
  // CRUD operations for each entity
  // Maintain relationships (e.g., order → inventory updates)
  // Generate IDs for new items
  // Update timestamps
}
```

---

### Phase 3: Environment Configuration (15 minutes)

#### 3.1 Environment Variables
**File:** `frontend/.env.local`

```bash
# API Mode
NEXT_PUBLIC_API_MODE=mock  # or 'live'

# Backend URL (used when API_MODE=live)
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1

# Mock API Settings
NEXT_PUBLIC_MOCK_DELAY=300  # ms
NEXT_PUBLIC_MOCK_ERRORS=false  # Simulate errors
```

#### 3.2 API Client Wrapper
**File:** `frontend/lib/api-client.ts` (modify existing)

```typescript
import { MockApiClient } from './mock-api-client';
import axios from 'axios';

const API_MODE = process.env.NEXT_PUBLIC_API_MODE || 'live';

// Use mock client in mock mode
const apiClient = API_MODE === 'mock' 
  ? new MockApiClient()
  : axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      // ... existing config
    });

export { apiClient };
```

---

### Phase 4: NPM Scripts (10 minutes)

#### 4.1 Package.json Scripts
**File:** `frontend/package.json`

```json
{
  "scripts": {
    "dev": "next dev -p 3001",
    "dev:mock": "NEXT_PUBLIC_API_MODE=mock next dev -p 3001",
    "dev:live": "NEXT_PUBLIC_API_MODE=live next dev -p 3001",
    "build": "next build",
    "build:mock": "NEXT_PUBLIC_API_MODE=mock next build",
    "start": "next start -p 3001",
    "start:mock": "NEXT_PUBLIC_API_MODE=mock next start -p 3001",
    "lint": "next lint"
  }
}
```

#### 4.2 Usage Commands

```bash
# Development with mock API
npm run dev:mock

# Development with live backend
npm run dev:live

# Build with mock API (for demo)
npm run build:mock

# Start production with mock API
npm run start:mock
```

---

### Phase 5: Mock Data Implementation (45 minutes)

#### 5.1 Detailed Mock Data Files

**users.ts**
```typescript
export const mockUsers = [
  {
    id: 'admin-1',
    email: 'admin@restaurant.com',
    password: 'admin123', // For mock login
    name: 'Admin User',
    role: 'admin',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  // ... 10+ users across all roles
];

export const mockCurrentUser = mockUsers[0]; // Default logged-in user
```

**menu.ts**
```typescript
export const mockMenuItems = [
  {
    id: 'menu-1',
    name: 'Margherita Pizza',
    description: 'Classic pizza with tomato sauce, mozzarella, and basil',
    category: 'main_course',
    price: 12.99,
    imageUrl: 'https://via.placeholder.com/300x200?text=Margherita+Pizza',
    isAvailable: true,
    preparationTime: 15,
    createdAt: '2024-01-01T00:00:00Z'
  },
  // ... 20+ menu items
];

export const mockCategories = [
  'starters',
  'main_course',
  'desserts',
  'beverages'
];
```

**orders.ts**
```typescript
export const mockOrders = [
  {
    id: 'order-1',
    customerId: 'customer-1',
    tableNumber: 5,
    orderStatus: 'preparing',
    paymentStatus: 'pending',
    totalAmount: 45.50,
    gstAmount: 2.28,
    items: [
      {
        id: 'order-item-1',
        menuItemId: 'menu-1',
        menuItem: mockMenuItems[0],
        quantity: 2,
        price: 12.99,
        status: 'preparing',
        customInstructions: 'Extra cheese please',
        allergyInfo: null
      }
    ],
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 min ago
    updatedAt: new Date().toISOString()
  },
  // ... 15+ orders in various states
];
```

**reservations.ts**
```typescript
export const mockReservations = [
  {
    id: 'reservation-1',
    customerId: 'customer-1',
    customer: mockUsers.find(u => u.id === 'customer-1'),
    tableNumber: 3,
    partySize: 4,
    reservationDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    reservationTime: '19:00',
    status: 'confirmed',
    specialRequests: 'Window seat preferred',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
  },
  // ... 15+ reservations
];

export const mockTables = [
  { number: 1, capacity: 2, status: 'available' },
  { number: 2, capacity: 2, status: 'occupied' },
  { number: 3, capacity: 4, status: 'reserved' },
  // ... 15 tables
];
```

**inventory.ts**
```typescript
export const mockInventory = [
  {
    id: 'inv-1',
    name: 'Tomatoes',
    unit: 'kg',
    totalStock: 50,
    reservedStock: 10,
    availableStock: 40,
    reorderThreshold: 20,
    category: 'vegetables',
    supplier: 'Fresh Farms',
    lastRestocked: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'inv-2',
    name: 'Mozzarella Cheese',
    unit: 'kg',
    totalStock: 5,
    reservedStock: 3,
    availableStock: 2,
    reorderThreshold: 10,
    category: 'dairy',
    supplier: 'Dairy Co',
    lastRestocked: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  // ... 15+ inventory items (including low stock)
];
```

**recipes.ts**
```typescript
export const mockRecipes = [
  {
    menuItemId: 'menu-1', // Margherita Pizza
    items: [
      {
        id: 'recipe-item-1',
        inventoryItemId: 'inv-1',
        inventoryItem: mockInventory[0], // Tomatoes
        quantityRequired: 0.2 // kg per serving
      },
      {
        id: 'recipe-item-2',
        inventoryItemId: 'inv-2',
        inventoryItem: mockInventory[1], // Mozzarella
        quantityRequired: 0.15
      }
    ],
    maxServings: 13 // Based on available stock
  },
  // ... recipes for all menu items
];
```

**transactions.ts**
```typescript
export const mockTransactions = [
  {
    id: 'trans-1',
    inventoryItemId: 'inv-1',
    inventoryItem: mockInventory[0],
    type: 'restock',
    quantity: 20,
    reason: 'Weekly restock',
    performedBy: 'inventory-1',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'trans-2',
    inventoryItemId: 'inv-2',
    type: 'deduction',
    quantity: -2,
    reason: 'Order #order-1 completed',
    orderId: 'order-1',
    performedBy: 'system',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  },
  // ... 20+ transactions
];
```

---

### Phase 6: Testing & Validation (15 minutes)

#### 6.1 Test Checklist

**Authentication Flow**
- [ ] Login with mock credentials
- [ ] Register new user (adds to mock state)
- [ ] OTP verification
- [ ] Get current user
- [ ] Logout

**Customer Flow**
- [ ] Browse menu (all categories)
- [ ] Search menu items
- [ ] Add to cart (localStorage)
- [ ] Checkout with custom instructions
- [ ] View order confirmation
- [ ] Track order status
- [ ] View order history
- [ ] Create reservation
- [ ] View/cancel reservations

**Admin Flow**
- [ ] View dashboard metrics
- [ ] Manage staff (CRUD)
- [ ] Manage menu (CRUD)
- [ ] Manage recipes
- [ ] View inventory overview

**Kitchen Flow**
- [ ] View order queue
- [ ] Update order status
- [ ] Update item status
- [ ] View custom instructions

**Reception Flow**
- [ ] View reservations
- [ ] Check-in customers
- [ ] Process payments
- [ ] Update reservation status

**Inventory Flow**
- [ ] View stock levels
- [ ] Restock items
- [ ] Adjust stock
- [ ] Filter low stock
- [ ] View transactions

#### 6.2 Validation Points

1. **Data Consistency**
   - Orders update inventory
   - Reservations update table status
   - Recipes calculate availability correctly

2. **State Persistence**
   - Changes persist during session
   - Cart persists in localStorage
   - Auth token persists

3. **Error Handling**
   - Invalid credentials
   - Insufficient stock
   - Duplicate reservations
   - Invalid data

4. **UI Responsiveness**
   - Loading states show
   - Success messages display
   - Error messages display
   - Polling works (if enabled)

---

## 📂 File Structure

```
frontend/
├── lib/
│   ├── mock-data/
│   │   ├── index.ts              # Export all
│   │   ├── users.ts              # 10+ users
│   │   ├── menu.ts               # 20+ items
│   │   ├── orders.ts             # 15+ orders
│   │   ├── reservations.ts       # 15+ reservations
│   │   ├── inventory.ts          # 15+ items
│   │   ├── recipes.ts            # Recipes for all items
│   │   ├── staff.ts              # 10+ staff
│   │   └── transactions.ts       # 20+ transactions
│   ├── mock-api-client.ts        # Mock API implementation
│   ├── mock-state.ts             # State management
│   └── api-client.ts             # Modified to support mock mode
├── .env.local                     # Environment config
└── package.json                   # Updated scripts
```

---

## 🚀 Implementation Steps

### Step 1: Create Mock Data (45 minutes)
1. Create `frontend/lib/mock-data/` directory
2. Create all 8 mock data files
3. Populate with realistic data
4. Export from `index.ts`

### Step 2: Build Mock API Client (45 minutes)
1. Create `mock-api-client.ts`
2. Implement all API methods
3. Add delay simulation
4. Handle authentication
5. Create `mock-state.ts` for state management

### Step 3: Configure Environment (15 minutes)
1. Update `.env.local` with API_MODE
2. Modify existing `api-client.ts` to support mock mode
3. Add conditional logic

### Step 4: Update Package Scripts (10 minutes)
1. Add `dev:mock` script
2. Add `dev:live` script
3. Add `build:mock` script
4. Add `start:mock` script

### Step 5: Test & Validate (15 minutes)
1. Run `npm run dev:mock`
2. Test all user flows
3. Verify data consistency
4. Check error handling
5. Test state persistence

---

## 🎯 Success Criteria

### Must Have
- [x] All API endpoints mocked
- [x] Realistic mock data for all entities
- [x] State management working
- [x] NPM scripts configured
- [x] Environment variables set up
- [x] All user flows testable

### Should Have
- [x] Simulated network delays
- [x] Error simulation (optional)
- [x] Data relationships maintained
- [x] State persistence across calls
- [x] Easy toggle between mock/live

### Nice to Have
- [ ] Mock data generator script
- [ ] Configurable delay times
- [ ] Error rate configuration
- [ ] Mock data reset function
- [ ] Export mock data to JSON

---

## 📝 Usage Instructions

### For Developers

**Start frontend in mock mode:**
```bash
cd frontend
npm run dev:mock
```

**Start frontend with live backend:**
```bash
cd frontend
npm run dev:live
```

**Build for demo (mock mode):**
```bash
cd frontend
npm run build:mock
npm run start:mock
```

### For Testing

**Test specific user role:**
1. Login with role-specific credentials:
   - Admin: `admin@restaurant.com` / `admin123`
   - Customer: `customer@example.com` / `customer123`
   - Kitchen: `chef@restaurant.com` / `chef123`
   - Inventory: `inventory@restaurant.com` / `inventory123`
   - Reception: `reception@restaurant.com` / `reception123`

2. Navigate to role-specific dashboard
3. Test all features
4. Verify data updates in mock state

**Test edge cases:**
- Low stock scenarios
- Insufficient inventory
- Concurrent orders
- Reservation conflicts
- Payment failures

---

## 🔧 Maintenance

### Adding New Mock Data
1. Add to appropriate file in `mock-data/`
2. Update `mock-state.ts` if needed
3. Update `mock-api-client.ts` methods
4. Test new data

### Updating Mock API
1. Add new method to `mock-api-client.ts`
2. Implement logic with mock data
3. Add delay simulation
4. Test endpoint

### Switching Modes
```bash
# In .env.local
NEXT_PUBLIC_API_MODE=mock  # Use mock API
NEXT_PUBLIC_API_MODE=live  # Use real backend
```

---

## 📊 Benefits

### Development
- ✅ Frontend team can work independently
- ✅ No backend dependency for UI development
- ✅ Faster iteration cycles
- ✅ Consistent test data

### Testing
- ✅ Predictable data for testing
- ✅ Easy to test edge cases
- ✅ No database cleanup needed
- ✅ Isolated frontend testing

### Demo
- ✅ Show UI without backend
- ✅ No server setup required
- ✅ Works offline
- ✅ Consistent demo experience

---

## ⚠️ Limitations

1. **No Real Persistence**
   - Data resets on page refresh (except localStorage)
   - No database backing

2. **Simplified Logic**
   - Some complex validations may be simplified
   - No real-time updates (unless polling implemented)

3. **No Backend Validation**
   - Client-side validation only
   - May miss backend-specific errors

4. **State Management**
   - In-memory state only
   - Not shared across tabs/windows

---

## 🎓 Best Practices

1. **Keep Mock Data Realistic**
   - Use realistic names, dates, amounts
   - Include edge cases (low stock, cancelled orders)
   - Maintain data relationships

2. **Simulate Real Behavior**
   - Add network delays
   - Return appropriate errors
   - Update related data (e.g., order → inventory)

3. **Easy Mode Switching**
   - Use environment variables
   - Single command to switch modes
   - No code changes needed

4. **Document Mock Credentials**
   - List all test users
   - Document their roles
   - Provide sample data

5. **Keep Mock API in Sync**
   - Update when real API changes
   - Match response formats
   - Include all endpoints

---

## 📅 Timeline

| Phase | Task | Time | Status |
|-------|------|------|--------|
| 1 | Create mock data files | 45 min | Pending |
| 2 | Build mock API client | 45 min | Pending |
| 3 | Configure environment | 15 min | Pending |
| 4 | Update NPM scripts | 10 min | Pending |
| 5 | Test & validate | 15 min | Pending |
| **Total** | | **2h 10min** | |

---

## 🚀 Next Steps

1. **Immediate:** Create mock data files
2. **Then:** Implement mock API client
3. **After:** Configure environment and scripts
4. **Finally:** Test all flows in mock mode

---

**Created:** 2026-07-26 08:27 IST  
**Estimated Completion:** 2-3 hours  
**Priority:** HIGH (enables parallel development)

---

*This mock API layer will enable independent frontend testing and development, allowing the team to work on UI/UX improvements while backend issues are being resolved.*
