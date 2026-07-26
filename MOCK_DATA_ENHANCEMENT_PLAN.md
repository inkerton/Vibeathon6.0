# Mock Data Enhancement Implementation Plan

## Overview

This document provides step-by-step instructions to enhance the existing mock data system in `lib/mock-data/` with new features from `frontend/mock-data.ts` (tables, waitlist, analytics).

## Prerequisites

- Current mock system in `lib/mock-data/` is functional
- New features identified: tables, waitlist, analytics
- No breaking changes to existing functionality

## Implementation Steps

### Step 1: Create tables.ts

**File:** `frontend/lib/mock-data/tables.ts`

```typescript
export interface MockTable {
  id: string;
  tableNumber: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
}

export const mockTables: MockTable[] = [
  { id: 'tbl-1', tableNumber: 1, capacity: 2, status: 'available' },
  { id: 'tbl-2', tableNumber: 2, capacity: 4, status: 'occupied' },
  { id: 'tbl-3', tableNumber: 3, capacity: 4, status: 'reserved' },
  { id: 'tbl-4', tableNumber: 4, capacity: 6, status: 'available' },
  { id: 'tbl-5', tableNumber: 5, capacity: 2, status: 'available' },
  { id: 'tbl-6', tableNumber: 10, capacity: 8, status: 'occupied' },
  { id: 'tbl-7', tableNumber: 11, capacity: 4, status: 'maintenance' },
];
```

### Step 2: Create waitlist.ts

**File:** `frontend/lib/mock-data/waitlist.ts`

```typescript
export interface MockWaitlistEntry {
  id: string;
  customerName: string;
  partySize: number;
  quotedTime: number; // in minutes
  status: 'waiting' | 'seated' | 'cancelled';
  createdAt: string;
}

const now = Date.now();

export const mockWaitlist: MockWaitlistEntry[] = [
  {
    id: 'wait-1',
    customerName: 'Frank Castle',
    partySize: 3,
    quotedTime: 15,
    status: 'waiting',
    createdAt: new Date(now - 10 * 60 * 1000).toISOString()
  },
  {
    id: 'wait-2',
    customerName: 'Jessica Jones',
    partySize: 2,
    quotedTime: 20,
    status: 'waiting',
    createdAt: new Date(now - 5 * 60 * 1000).toISOString()
  }
];
```

### Step 3: Create analytics.ts

**File:** `frontend/lib/mock-data/analytics.ts`

```typescript
import { mockReservations } from './reservations';
import { mockOrders } from './orders';

export interface MockAnalytics {
  summary: {
    todaysReservations: number;
    pendingCheckIn: number;
    currentlySeated: number;
    pendingPayments: number;
  };
  sales: {
    today: number;
    week: number;
    month: number;
  };
  popularItems: Array<{ name: string; count: number }>;
  peakHours: Array<{ hour: string; count: number }>;
}

const today = new Date().toISOString().split('T')[0];

export const mockAnalytics: MockAnalytics = {
  summary: {
    todaysReservations: mockReservations.filter(r => 
      r.reservationDate === today
    ).length,
    pendingCheckIn: mockReservations.filter(r => 
      r.reservationDate === today && r.status === 'confirmed'
    ).length,
    currentlySeated: mockReservations.filter(r => 
      r.reservationDate === today && r.status === 'checked_in'
    ).length,
    pendingPayments: mockOrders.filter(o => 
      o.paymentStatus === 'pending'
    ).length,
  },
  sales: {
    today: 1250.75,
    week: 8750.50,
    month: 35000.00,
  },
  popularItems: [
    { name: 'Spaghetti Carbonara', count: 150 },
    { name: 'Margherita Pizza', count: 120 },
    { name: 'Chicken Alfredo', count: 95 },
  ],
  peakHours: [
    { hour: '18:00', count: 30 },
    { hour: '19:00', count: 55 },
    { hour: '20:00', count: 45 },
  ]
};
```

### Step 4: Update index.ts

**File:** `frontend/lib/mock-data/index.ts`

Add these exports:

```typescript
// Export all mock data
export * from './users';
export * from './menu';
export * from './orders';
export * from './reservations';
export * from './inventory';
export * from './recipes';
export * from './staff';
export * from './transactions';
export * from './tables';      // NEW
export * from './waitlist';    // NEW
export * from './analytics';   // NEW
```

### Step 5: Update mock-state.ts

**File:** `frontend/lib/mock-state.ts`

Add imports:

```typescript
import {
  mockUsers,
  mockMenuItems,
  mockOrders,
  mockReservations,
  mockInventory,
  mockRecipes,
  mockStaff,
  mockTransactions,
  mockTables,        // NEW
  mockWaitlist,      // NEW
  mockAnalytics,     // NEW
  MockUser,
  MockMenuItem,
  MockOrder,
  MockReservation,
  MockInventoryItem,
  MockRecipe,
  MockStaff,
  MockInventoryTransaction,
  MockTable,         // NEW
  MockWaitlistEntry, // NEW
  MockAnalytics      // NEW
} from './mock-data';
```

Add to MockState class:

```typescript
class MockState {
  // ... existing properties ...
  private tables: MockTable[] = [...mockTables];
  private waitlist: MockWaitlistEntry[] = [...mockWaitlist];
  private analytics: MockAnalytics = { ...mockAnalytics };

  // Table methods
  getTables() {
    return [...this.tables];
  }

  getTableById(id: string) {
    return this.tables.find(t => t.id === id);
  }

  getTableByNumber(number: number) {
    return this.tables.find(t => t.tableNumber === number);
  }

  updateTableStatus(id: string, status: MockTable['status']) {
    const index = this.tables.findIndex(t => t.id === id);
    if (index !== -1) {
      this.tables[index] = { ...this.tables[index], status };
    }
  }

  getAvailableTables() {
    return this.tables.filter(t => t.status === 'available');
  }

  // Waitlist methods
  getWaitlist() {
    return [...this.waitlist];
  }

  getWaitlistById(id: string) {
    return this.waitlist.find(w => w.id === id);
  }

  addToWaitlist(entry: MockWaitlistEntry) {
    this.waitlist.push(entry);
  }

  updateWaitlistStatus(id: string, status: MockWaitlistEntry['status']) {
    const index = this.waitlist.findIndex(w => w.id === id);
    if (index !== -1) {
      this.waitlist[index] = { ...this.waitlist[index], status };
    }
  }

  removeFromWaitlist(id: string) {
    this.waitlist = this.waitlist.filter(w => w.id !== id);
  }

  // Analytics methods
  getAnalytics() {
    // Recalculate dynamic values
    const today = new Date().toISOString().split('T')[0];
    return {
      ...this.analytics,
      summary: {
        todaysReservations: this.reservations.filter(r => 
          r.reservationDate === today
        ).length,
        pendingCheckIn: this.reservations.filter(r => 
          r.reservationDate === today && r.status === 'confirmed'
        ).length,
        currentlySeated: this.reservations.filter(r => 
          r.reservationDate === today && r.status === 'checked_in'
        ).length,
        pendingPayments: this.orders.filter(o => 
          o.paymentStatus === 'pending'
        ).length,
      }
    };
  }

  // Update reset method
  reset() {
    this.users = [...mockUsers];
    this.menuItems = [...mockMenuItems];
    this.orders = [...mockOrders];
    this.reservations = [...mockReservations];
    this.inventory = [...mockInventory];
    this.recipes = [...mockRecipes];
    this.staff = [...mockStaff];
    this.transactions = [...mockTransactions];
    this.tables = [...mockTables];           // NEW
    this.waitlist = [...mockWaitlist];       // NEW
    this.analytics = { ...mockAnalytics };   // NEW
    this.currentUser = null;
    this.authToken = null;
  }
}
```

### Step 6: Update mock-api-client.ts

**File:** `frontend/lib/mock-api-client.ts`

Add to the `get` method:

```typescript
async get(url: string): Promise<{ data: any }> {
  // ... existing endpoints ...

  // Table endpoints
  if (url === '/tables') {
    return this.getTables();
  }
  if (url === '/tables/available') {
    return this.getAvailableTables();
  }
  if (url.match(/\/tables\/(.+)/)) {
    const id = url.split('/')[2];
    return this.getTableById(id);
  }

  // Waitlist endpoints
  if (url === '/waitlist') {
    return this.getWaitlist();
  }
  if (url.match(/\/waitlist\/(.+)/)) {
    const id = url.split('/')[2];
    return this.getWaitlistById(id);
  }

  // Analytics endpoints
  if (url === '/analytics') {
    return this.getAnalytics();
  }
  if (url === '/analytics/summary') {
    return this.getAnalyticsSummary();
  }

  throw new Error(`Mock GET endpoint not implemented: ${url}`);
}
```

Add to the `post` method:

```typescript
async post(url: string, data?: any): Promise<{ data: any }> {
  // ... existing endpoints ...

  // Waitlist endpoints
  if (url === '/waitlist') {
    return this.addToWaitlist(data);
  }

  throw new Error(`Mock POST endpoint not implemented: ${url}`);
}
```

Add to the `patch` method:

```typescript
async patch(url: string, data?: any): Promise<{ data: any }> {
  // ... existing endpoints ...

  // Table endpoints
  if (url.match(/\/tables\/(.+)\/status/)) {
    const id = url.split('/')[2];
    return this.updateTableStatus(id, data.status);
  }

  // Waitlist endpoints
  if (url.match(/\/waitlist\/(.+)\/status/)) {
    const id = url.split('/')[2];
    return this.updateWaitlistStatus(id, data.status);
  }

  throw new Error(`Mock PATCH endpoint not implemented: ${url}`);
}
```

Add to the `delete` method:

```typescript
async delete(url: string): Promise<{ data: any }> {
  // ... existing endpoints ...

  // Waitlist endpoints
  if (url.match(/\/waitlist\/(.+)/)) {
    const id = url.split('/')[2];
    return this.removeFromWaitlist(id);
  }

  throw new Error(`Mock DELETE endpoint not implemented: ${url}`);
}
```

Add the implementation methods at the end of the class:

```typescript
// ==================== TABLE METHODS ====================

private async getTables() {
  return this.mockRequest(() => {
    return mockState.getTables();
  });
}

private async getTableById(id: string) {
  return this.mockRequest(() => {
    const table = mockState.getTableById(id);
    if (!table) {
      throw new Error('Table not found');
    }
    return table;
  });
}

private async getAvailableTables() {
  return this.mockRequest(() => {
    return mockState.getAvailableTables();
  });
}

private async updateTableStatus(id: string, status: string) {
  return this.mockRequest(() => {
    mockState.updateTableStatus(id, status as any);
    return mockState.getTableById(id);
  });
}

// ==================== WAITLIST METHODS ====================

private async getWaitlist() {
  return this.mockRequest(() => {
    return mockState.getWaitlist();
  });
}

private async getWaitlistById(id: string) {
  return this.mockRequest(() => {
    const entry = mockState.getWaitlistById(id);
    if (!entry) {
      throw new Error('Waitlist entry not found');
    }
    return entry;
  });
}

private async addToWaitlist(data: any) {
  return this.mockRequest(() => {
    const newEntry = {
      id: mockState.generateId('wait'),
      customerName: data.customerName,
      partySize: data.partySize,
      quotedTime: data.quotedTime || 15,
      status: 'waiting' as const,
      createdAt: new Date().toISOString()
    };
    mockState.addToWaitlist(newEntry);
    return newEntry;
  });
}

private async updateWaitlistStatus(id: string, status: string) {
  return this.mockRequest(() => {
    mockState.updateWaitlistStatus(id, status as any);
    return mockState.getWaitlistById(id);
  });
}

private async removeFromWaitlist(id: string) {
  return this.mockRequest(() => {
    mockState.removeFromWaitlist(id);
    return { message: 'Waitlist entry removed successfully' };
  });
}

// ==================== ANALYTICS METHODS ====================

private async getAnalytics() {
  return this.mockRequest(() => {
    return mockState.getAnalytics();
  });
}

private async getAnalyticsSummary() {
  return this.mockRequest(() => {
    return mockState.getAnalytics().summary;
  });
}
```

### Step 7: Delete Unused Files

Remove these files as they are no longer needed:

```bash
rm frontend/mock-data.ts
rm frontend/mock-api-client.ts
```

### Step 8: Update Documentation

Add to `README.md` or create `MOCK_SYSTEM.md`:

```markdown
## Mock Data System

The application uses a comprehensive mock data system for development and testing.

### Location
- **Mock Data:** `frontend/lib/mock-data/`
- **State Management:** `frontend/lib/mock-state.ts`
- **API Client:** `frontend/lib/mock-api-client.ts`

### Features
- 13 users with authentication
- 22 menu items across 4 categories
- 13 orders with various states
- 21 inventory items with stock tracking
- Reservations with multiple statuses
- Recipe management
- Staff management
- Inventory transactions
- 7 tables with status tracking
- Waitlist management
- Analytics and reporting

### Usage

Set environment variable to enable mock mode:
```bash
NEXT_PUBLIC_API_MODE=mock
```

### Data Types

All data types are fully typed with TypeScript interfaces in their respective files.
```

## Testing Checklist

After implementation, verify:

- [ ] All existing features still work
- [ ] Tables can be fetched and updated
- [ ] Waitlist entries can be added, updated, and removed
- [ ] Analytics data is calculated correctly
- [ ] No TypeScript errors
- [ ] Mock API client handles all new endpoints
- [ ] State management works for new data types
- [ ] Old mock files are deleted
- [ ] Documentation is updated

## Rollback Plan

If issues occur:

1. Restore from git: `git checkout -- frontend/lib/mock-data/`
2. Keep old files temporarily
3. Debug issues before removing old files
4. Test thoroughly in development before deploying

## Success Criteria

✅ All new features (tables, waitlist, analytics) are integrated
✅ No breaking changes to existing functionality
✅ All TypeScript types are correct
✅ Mock API client handles all endpoints
✅ State management is complete
✅ Old unused files are removed
✅ Documentation is updated
✅ All tests pass

## Notes

- The OLD mock system is superior in data richness
- NEW features are being added to OLD system
- This approach preserves all existing functionality
- Minimal risk of breaking changes
