# Mock Data Analysis & Migration Plan

## Current Situation

The frontend has **TWO** mock data systems:

1. **OLD/CURRENT (lib/mock-data/)** - Currently in use ✅
2. **NEW (frontend/mock-data.ts)** - Not being used ❌

## Key Finding

**The OLD data in `lib/mock-data/` is actually RICHER and more comprehensive than the NEW data in `frontend/mock-data.ts`.**

## Detailed Comparison

### Data Volume Comparison

| Data Type | OLD (lib/mock-data/) | NEW (mock-data.ts) | Winner |
|-----------|---------------------|-------------------|---------|
| **Users** | 13 users with passwords | 7 users (no passwords) | OLD ✅ |
| **Menu Items** | 22 items | 12 items | OLD ✅ |
| **Orders** | 13 orders | 5 orders | OLD ✅ |
| **Inventory** | 21 items | 11 items | OLD ✅ |
| **Reservations** | Multiple with detailed tracking | 8 with edge cases | Similar |
| **Tables** | Not included | 7 tables | NEW ✅ |
| **Waitlist** | Not included | 2 entries | NEW ✅ |
| **Analytics** | Not included | Summary data | NEW ✅ |

### Feature Comparison

#### OLD System (lib/mock-data/) - Currently Active

**Strengths:**
- ✅ **Full authentication support** with passwords
- ✅ **State management** via `mockState.ts`
- ✅ **Comprehensive user roles**: admin, customer, kitchen, reception, inventory
- ✅ **Rich menu data**: 22 items across 4 categories with images
- ✅ **Detailed order tracking**: 13 orders with multiple states
- ✅ **Advanced inventory**: 21 items with stock levels, reservations, transactions
- ✅ **Recipe management**: Ingredients linked to menu items
- ✅ **Transaction history**: Full audit trail for inventory changes
- ✅ **TypeScript interfaces**: Strongly typed data structures
- ✅ **Real-time updates**: State changes propagate correctly

**Architecture:**
```
lib/
├── mock-data/
│   ├── index.ts          # Exports all data
│   ├── users.ts          # 13 users with auth
│   ├── menu.ts           # 22 menu items
│   ├── orders.ts         # 13 orders
│   ├── inventory.ts      # 21 inventory items
│   ├── reservations.ts   # Reservations
│   ├── recipes.ts        # Recipe management
│   ├── staff.ts          # Staff data
│   └── transactions.ts   # Inventory transactions
├── mock-state.ts         # State management
├── mock-api-client.ts    # API client implementation
└── api-client.ts         # Main API client (uses mock-api-client)
```

#### NEW System (frontend/mock-data.ts) - Not in Use

**Strengths:**
- ✅ **Tables data**: 7 tables with status
- ✅ **Waitlist**: 2 waitlist entries
- ✅ **Analytics**: Summary statistics
- ✅ **Edge cases**: Includes test cases (undefined date)
- ✅ **Single file**: Easier to understand at a glance

**Weaknesses:**
- ❌ **No authentication**: Missing password fields
- ❌ **Less data**: Fewer users, menu items, orders, inventory
- ❌ **No state management**: Static data only
- ❌ **No TypeScript interfaces**: Less type safety
- ❌ **Simpler structure**: Less realistic for testing

**Architecture:**
```
frontend/
├── mock-data.ts          # Single file with all data
└── mock-api-client.ts    # Uses axios-mock-adapter
```

## Current Usage

**Active System:** OLD (lib/mock-data/)

Evidence:
```typescript
// lib/api-client.ts (line 2)
import { mockApiClient } from './mock-api-client';

// lib/mock-api-client.ts (line 10)
import { mockState } from './mock-state';

// lib/mock-state.ts (line 18)
import { mockUsers, mockMenuItems, ... } from './mock-data';
```

## Recommendation

**DO NOT migrate to the new mock-data.ts**

### Reasons:

1. **Data Richness**: The OLD system has significantly more data for testing
2. **Authentication**: OLD system supports full auth flow with passwords
3. **State Management**: OLD system has proper state management
4. **Type Safety**: OLD system uses TypeScript interfaces
5. **Already Working**: The OLD system is currently integrated and functional
6. **Better Testing**: More data = better edge case coverage

## Proposed Action Plan

### Option 1: Keep OLD System (RECOMMENDED) ✅

**Actions:**
1. ✅ Keep using `lib/mock-data/` and `lib/mock-api-client.ts`
2. ✅ Add missing features from NEW to OLD:
   - Add tables data to `lib/mock-data/`
   - Add waitlist data to `lib/mock-data/`
   - Add analytics data to `lib/mock-data/`
3. ✅ Remove unused files:
   - Delete `frontend/mock-data.ts`
   - Delete `frontend/mock-api-client.ts`
4. ✅ Document the mock system in README

### Option 2: Enhance NEW System (NOT RECOMMENDED) ❌

**Would require:**
- Add 6 more users with passwords
- Add 10 more menu items
- Add 8 more orders
- Add 10 more inventory items
- Implement state management
- Add TypeScript interfaces
- Migrate all existing code
- Test everything again

**Effort:** High | **Risk:** High | **Benefit:** Low

## Migration Steps (If Choosing Option 1)

### Step 1: Enhance OLD System with NEW Features

Add to `lib/mock-data/`:

```typescript
// tables.ts
export interface MockTable {
  id: string;
  tableNumber: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
}

export const mockTables: MockTable[] = [
  // Copy from new mock-data.ts
];

// waitlist.ts
export interface MockWaitlistEntry {
  id: string;
  customerName: string;
  partySize: number;
  quotedTime: number;
  status: 'waiting' | 'seated' | 'cancelled';
  createdAt: string;
}

export const mockWaitlist: MockWaitlistEntry[] = [
  // Copy from new mock-data.ts
];

// analytics.ts
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

export const mockAnalytics: MockAnalytics = {
  // Copy from new mock-data.ts
};
```

### Step 2: Update mock-state.ts

Add state management for new data types:

```typescript
class MockState {
  private tables: MockTable[] = [...mockTables];
  private waitlist: MockWaitlistEntry[] = [...mockWaitlist];
  
  // Add getters and setters
  getTables() { return [...this.tables]; }
  getWaitlist() { return [...this.waitlist]; }
  // ... etc
}
```

### Step 3: Update mock-api-client.ts

Add endpoints for new features:

```typescript
// Tables endpoints
private async getTables() {
  return this.mockRequest(() => mockState.getTables());
}

// Waitlist endpoints
private async getWaitlist() {
  return this.mockRequest(() => mockState.getWaitlist());
}

// Analytics endpoints
private async getAnalytics() {
  return this.mockRequest(() => mockState.getAnalytics());
}
```

### Step 4: Clean Up

```bash
# Remove unused files
rm frontend/mock-data.ts
rm frontend/mock-api-client.ts

# Update documentation
# Add to README.md explaining mock system
```

## File Structure After Migration

```
frontend/
├── lib/
│   ├── mock-data/
│   │   ├── index.ts
│   │   ├── users.ts (13 users)
│   │   ├── menu.ts (22 items)
│   │   ├── orders.ts (13 orders)
│   │   ├── inventory.ts (21 items)
│   │   ├── reservations.ts
│   │   ├── recipes.ts
│   │   ├── staff.ts
│   │   ├── transactions.ts
│   │   ├── tables.ts (NEW)
│   │   ├── waitlist.ts (NEW)
│   │   └── analytics.ts (NEW)
│   ├── mock-state.ts (enhanced)
│   ├── mock-api-client.ts (enhanced)
│   └── api-client.ts
└── [DELETED] mock-data.ts
└── [DELETED] mock-api-client.ts
```

## Benefits of This Approach

1. ✅ **Preserve existing functionality**: No breaking changes
2. ✅ **Add new features**: Tables, waitlist, analytics
3. ✅ **Maintain data richness**: Keep all 13 users, 22 menu items, etc.
4. ✅ **Keep type safety**: TypeScript interfaces remain
5. ✅ **Minimal risk**: Only adding, not replacing
6. ✅ **Clean codebase**: Remove duplicate/unused files

## Conclusion

**The OLD mock data system in `lib/mock-data/` is superior and should be kept.**

The NEW `frontend/mock-data.ts` has some useful additions (tables, waitlist, analytics) but lacks the depth and functionality of the OLD system. The best approach is to:

1. Keep the OLD system as the foundation
2. Add the NEW features (tables, waitlist, analytics) to the OLD system
3. Delete the unused NEW files
4. Document the mock system properly

This gives us the best of both worlds: comprehensive data + new features.
