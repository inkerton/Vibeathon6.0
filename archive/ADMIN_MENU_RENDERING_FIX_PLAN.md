# Admin Menu Page Rendering Issues - Fix Plan

## Problem Analysis

The admin menu page (`/frontend/app/admin/menu/page.tsx`) is buggy and doesn't always render menu items correctly.

## Root Causes Identified

### 1. **useMemo Dependency Array Issue** (CRITICAL)

**Location:** Lines 175-283

**Problem:**
```javascript
const columns = useMemo<MRT_ColumnDef<MenuItem>[]>(
  () => [...],
  [
    handleDelete,
    handleOpenModal,
    handleToggleAvailability,
    getCategoryBadgeVariant,
  ]
);
```

**Why it's broken:**
- These function references are recreated on EVERY render
- This causes `useMemo` to think dependencies changed
- MaterialReactTable columns are recreated unnecessarily
- This can cause the table to lose state, re-render incorrectly, or not render at all

**Impact:** HIGH - This is likely the main cause of inconsistent rendering

### 2. **Missing Price Formatting**

**Location:** Line 217

**Problem:**
```javascript
Cell: ({ cell }) => `₹${cell.getValue<number>()}`,
```

**Issue:** No decimal formatting - prices might show as `₹299` instead of `₹299.00`

### 3. **Backend Response Handling**

**Location:** Lines 68-71

**Current code:**
```javascript
const items = response.data?.data || response.data || [];
setMenuItems(Array.isArray(items) ? items : []);
```

**Potential issue:** If backend returns unexpected structure, might set empty array even when data exists

### 4. **No Error Boundary for MaterialReactTable**

If MaterialReactTable throws an error during rendering, the entire page crashes with no fallback UI.

### 5. **Function Definitions Inside Component**

All handler functions are defined inside the component body, causing them to be recreated on every render.

## Solutions

### Solution 1: Fix useMemo Dependencies (CRITICAL)

**Option A: Use useCallback for all handlers**
```javascript
const handleDelete = useCallback(async (itemId: string) => {
  // ... implementation
}, []);

const handleOpenModal = useCallback((item?: MenuItem) => {
  // ... implementation
}, []);

const handleToggleAvailability = useCallback(async (itemId: string, currentStatus: boolean) => {
  // ... implementation
}, []);

const getCategoryBadgeVariant = useCallback((category: string) => {
  // ... implementation
}, []);

const columns = useMemo<MRT_ColumnDef<MenuItem>[]>(
  () => [...],
  [handleDelete, handleOpenModal, handleToggleAvailability, getCategoryBadgeVariant]
);
```

**Option B: Remove dependencies (simpler, recommended)**
```javascript
const columns = useMemo<MRT_ColumnDef<MenuItem>[]>(
  () => [
    // ... column definitions with inline handlers
  ],
  [] // Empty dependency array - columns never change
);
```

**Recommendation:** Use Option B - define columns once with inline function calls

### Solution 2: Fix Price Formatting

```javascript
{
  accessorKey: "price",
  header: "Price",
  Cell: ({ cell }) => `₹${Number(cell.getValue<number>()).toFixed(2)}`,
},
```

### Solution 3: Improve Backend Response Handling

```javascript
const fetchMenuItems = async () => {
  try {
    setLoading(true);
    setError('');
    const response = await apiClient.get('/menu?includeUnavailable=true');
    
    // More robust response handling
    let items = [];
    if (response.data?.data && Array.isArray(response.data.data)) {
      items = response.data.data;
    } else if (Array.isArray(response.data)) {
      items = response.data;
    }
    
    console.log('Fetched menu items:', items.length); // Debug log
    setMenuItems(items);
  } catch (err: any) {
    console.error('Failed to fetch menu items:', err);
    setError(err.message || 'Failed to load menu items');
    setMenuItems([]); // Explicitly set empty array on error
  } finally {
    setLoading(false);
  }
};
```

### Solution 4: Add Error Boundary

Wrap MaterialReactTable in a try-catch or error boundary:

```javascript
{menuItems.length === 0 ? (
  <div className="text-center py-8 text-gray-500">
    No menu items found. Create your first menu item.
  </div>
) : (
  <MaterialReactTable
    columns={columns}
    data={menuItems}
    // ... props
  />
)}
```

### Solution 5: Add useCallback Import

```javascript
import { useEffect, useState, useMemo, useCallback } from 'react';
```

## Implementation Priority

1. **HIGH PRIORITY:** Fix useMemo dependencies (Solution 1, Option B)
2. **MEDIUM:** Add price formatting (Solution 2)
3. **MEDIUM:** Improve response handling with debug logs (Solution 3)
4. **LOW:** Add empty state check (Solution 4)

## Testing Checklist

After implementing fixes:

- [ ] Menu items render consistently on page load
- [ ] Menu items render after creating a new item
- [ ] Menu items render after editing an item
- [ ] Menu items render after deleting an item
- [ ] Menu items render after toggling availability
- [ ] Prices display with 2 decimal places (₹299.00)
- [ ] Table sorting works correctly
- [ ] Table filtering works correctly
- [ ] Table pagination works correctly
- [ ] No console errors related to MaterialReactTable
- [ ] Check browser console for "Fetched menu items: X" log

## Files to Modify

- `/frontend/app/admin/menu/page.tsx`

## Recommended Implementation Order

1. Add `useCallback` import
2. Fix `columns` useMemo to use empty dependency array with inline handlers
3. Fix price formatting
4. Add debug logging to fetchMenuItems
5. Add empty state check before MaterialReactTable
6. Test thoroughly

## Alternative: Simplify with Direct Column Definition

If issues persist, consider defining columns outside the component:

```javascript
const createColumns = (
  handleDelete: (id: string) => void,
  handleOpenModal: (item?: MenuItem) => void,
  handleToggleAvailability: (id: string, status: boolean) => void,
  getCategoryBadgeVariant: (category: string) => string
): MRT_ColumnDef<MenuItem>[] => [
  // ... column definitions
];

// Inside component:
const columns = useMemo(
  () => createColumns(handleDelete, handleOpenModal, handleToggleAvailability, getCategoryBadgeVariant),
  []
);
```

This ensures columns are only created once and handlers are called correctly.
