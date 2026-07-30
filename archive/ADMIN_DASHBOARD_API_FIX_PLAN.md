# Admin Dashboard API Response Handling Fix Plan

## Problem
Multiple API endpoints in the admin dashboard are returning data in the format:
```json
{
  "status": "success",
  "data": [...]
}
```

But the frontend code expects the array directly, causing errors:
- `orders.filter is not a function` (app/admin/page.tsx:87)
- `inventory.map is not a function` (app/admin/inventory/page.tsx:182)

## Root Cause
The backend consistently returns responses in the format `{ status: 'success', data: [...] }`, but the frontend is not consistently extracting the `data` property.

## Affected Files

### 1. Admin Dashboard (`frontend/app/admin/page.tsx`)
**Line 79**: `const orders = ordersRes.data;`
- Should be: `const orders = ordersRes.data?.data || ordersRes.data || [];`

**Line 80**: `const lowStockItems = inventoryRes.data;`
- Should be: `const lowStockItems = inventoryRes.data?.data || inventoryRes.data || [];`

**Line 81**: `const reservations = reservationsRes.data;`
- Should be: `const reservations = reservationsRes.data?.data || reservationsRes.data || [];`

**Line 82**: `const staff = staffRes.data;`
- Should be: `const staff = staffRes.data?.data || staffRes.data || [];`

### 2. Admin Inventory Page (`frontend/app/admin/inventory/page.tsx`)
Need to check how inventory data is fetched and ensure proper extraction.

## Solution Pattern

Use the same pattern we applied to the menu page:

```typescript
// Before
const items = response.data;

// After
const items = response.data?.data || response.data || [];
setItems(Array.isArray(items) ? items : []);
```

This handles:
1. Nested `data.data` structure (backend standard)
2. Direct `data` array (fallback)
3. Empty array default
4. Validates result is actually an array

## Implementation Steps

### Step 1: Fix Admin Dashboard Data Extraction
**File**: `frontend/app/admin/page.tsx`
- Update lines 79-82 to properly extract data from nested response
- Add array validation

### Step 2: Fix Admin Inventory Page Data Extraction
**File**: `frontend/app/admin/inventory/page.tsx`
- Find where inventory data is fetched
- Apply same fix pattern
- Add array validation

### Step 3: Check Other Admin Pages
Verify and fix if needed:
- `app/admin/recipes/page.tsx`
- Any other pages that fetch array data

## Testing Checklist

- [ ] Admin dashboard loads without errors
- [ ] Orders statistics display correctly
- [ ] Inventory low stock items display
- [ ] Reservations display correctly
- [ ] Staff count displays correctly
- [ ] Admin inventory page loads without errors
- [ ] Inventory items list displays correctly

## Success Criteria

✅ No `filter is not a function` errors
✅ No `map is not a function` errors
✅ All dashboard statistics display correctly
✅ All data tables render properly
✅ Consistent error handling across all pages
