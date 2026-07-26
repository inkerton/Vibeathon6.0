# Admin Menu Page - Mock Data Not Showing Fix Plan

## Problem Analysis

When accessing `/admin/menu` in mock mode, no menu items are displayed despite mock data being available.

### Root Causes Identified:

#### 1. **Category Name Mismatch**
- **Mock Data Categories** (in `lib/mock-data/menu.ts`):
  - `'starters'`
  - `'main_course'`
  - `'desserts'`
  - `'beverages'`

- **Page Expected Categories** (in `app/admin/menu/page.tsx` line 29):
  - `'appetizer'`
  - `'main_course'` ✅ (matches)
  - `'dessert'`
  - `'beverage'`
  - `'special'`

**Impact**: When filtering by category, items with mismatched categories won't be found.

#### 2. **Mock API Response Structure**
- **Current Mock API** (`lib/mock-api-client.ts` line 236):
  ```typescript
  private async getMenu() {
    return this.mockRequest(() => {
      return mockState.getMenuItems();
    });
  }
  ```
  Returns: `{ data: [...menuItems] }`

- **Page Expects** (`app/admin/menu/page.tsx` line 67):
  ```typescript
  const items = response.data?.data || response.data || [];
  ```
  Expects: `{ data: { data: [...menuItems] } }` OR `{ data: [...menuItems] }`

**Current behavior**: Works because of fallback `|| response.data`, but inconsistent with backend API pattern.

#### 3. **Badge Variant Issue**
- **Line 178** in `admin/menu/page.tsx`:
  ```typescript
  return variants[category] || 'gray';
  ```
  Returns `'gray'` which is not a valid Badge variant (should be `'secondary'`)

## Detailed Issues

### Issue #1: Category Mismatch in Mock Data

**Mock Data** (`lib/mock-data/menu.ts`):
```typescript
export interface MockMenuItem {
  category: 'starters' | 'main_course' | 'desserts' | 'beverages';
  // ...
}

// Example items:
{
  category: 'starters',  // ❌ Should be 'appetizer'
  // ...
},
{
  category: 'desserts',  // ❌ Should be 'dessert'
  // ...
},
{
  category: 'beverages', // ❌ Should be 'beverage'
  // ...
}
```

**Page Constants** (`app/admin/menu/page.tsx` line 29):
```typescript
const CATEGORIES = ['appetizer', 'main_course', 'dessert', 'beverage', 'special'];
```

### Issue #2: Inconsistent Response Structure

**Backend API Pattern** (from other endpoints):
```typescript
// Backend returns: { status: 'success', data: [...] }
const staffData = response.data?.data || [];
```

**Current Mock API**:
```typescript
// Returns: { data: [...] } directly
return mockState.getMenuItems();
```

**Should Return**:
```typescript
// Should wrap in data property for consistency
return { data: mockState.getMenuItems() };
```

### Issue #3: Invalid Badge Variant

**Current Code** (line 178):
```typescript
const getCategoryBadgeVariant = (category: string) => {
  const variants: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    appetizer: 'info',
    main_course: 'success',
    dessert: 'warning',
    beverage: 'info',
    special: 'danger',
  };
  return variants[category] || 'gray';  // ❌ 'gray' is invalid
};
```

## Fix Plan

### Step 1: Update Mock Data Categories ✅
**Action**: Update all category values in mock data to match page expectations

**File**: `/frontend/lib/mock-data/menu.ts`

**Changes**:
1. Update TypeScript interface:
   ```typescript
   export interface MockMenuItem {
     category: 'appetizer' | 'main_course' | 'dessert' | 'beverage';
   }
   ```

2. Update all menu items:
   - `'starters'` → `'appetizer'`
   - `'desserts'` → `'dessert'`
   - `'beverages'` → `'beverage'`

3. Update mockCategories export:
   ```typescript
   export const mockCategories = ['appetizer', 'main_course', 'dessert', 'beverage'];
   ```

### Step 2: Fix Mock API Response Structure ✅
**Action**: Wrap menu items in nested data structure for consistency

**File**: `/frontend/lib/mock-api-client.ts`

**Before** (line 236):
```typescript
private async getMenu() {
  return this.mockRequest(() => {
    return mockState.getMenuItems();
  });
}
```

**After**:
```typescript
private async getMenu() {
  return this.mockRequest(() => {
    return { data: mockState.getMenuItems() };
  });
}
```

### Step 3: Fix Badge Variant Fallback ✅
**Action**: Change fallback from 'gray' to 'secondary'

**File**: `/frontend/app/admin/menu/page.tsx`

**Before** (line 178):
```typescript
return variants[category] || 'gray';
```

**After**:
```typescript
return variants[category] || 'secondary';
```

### Step 4: Update Page Response Handling (Optional) ✅
**Action**: Simplify response handling since mock API will now match backend structure

**File**: `/frontend/app/admin/menu/page.tsx`

**Before** (line 67):
```typescript
const items = response.data?.data || response.data || [];
```

**After** (can be simplified to):
```typescript
const items = response.data?.data || [];
```

## Implementation Order

1. ✅ **Update mock data categories** (`lib/mock-data/menu.ts`)
2. ✅ **Fix mock API response structure** (`lib/mock-api-client.ts`)
3. ✅ **Fix Badge variant fallback** (`app/admin/menu/page.tsx`)
4. ✅ **Test menu page** to verify items display correctly

## Expected Outcome

After fixes:
- **All 22 menu items display correctly** in admin menu page
- **Category filtering works** for all categories
- **Badge colors display correctly** for all categories
- **Mock API response structure matches backend** pattern
- **No console errors** related to undefined or invalid data

## Testing Checklist

- [ ] Navigate to `/admin/menu` in mock mode
- [ ] Verify all 22 menu items are displayed
- [ ] Test "All" filter - should show all items
- [ ] Test "Appetizer" filter - should show 5 items (formerly starters)
- [ ] Test "Main Course" filter - should show 8 items
- [ ] Test "Dessert" filter - should show 4 items (formerly desserts)
- [ ] Test "Beverage" filter - should show 5 items (formerly beverages)
- [ ] Verify category badges display with correct colors
- [ ] Verify availability badges show correctly
- [ ] Test create new menu item functionality
- [ ] Test edit menu item functionality
- [ ] Test toggle availability functionality
- [ ] Test delete menu item functionality

## Files to Modify

1. `/frontend/lib/mock-data/menu.ts` - Update categories
2. `/frontend/lib/mock-api-client.ts` - Fix response structure
3. `/frontend/app/admin/menu/page.tsx` - Fix Badge variant (already done in previous fix)

## Additional Notes

### Why This Happened

The mock data was likely created with different category names than what the page expects. This is a common issue when:
1. Mock data is created before finalizing the API contract
2. Different developers work on mock data vs. page implementation
3. Category names change during development but mock data isn't updated

### Prevention

To prevent similar issues:
1. **Define API contracts first** - Document expected data structures before implementation
2. **Use TypeScript interfaces** - Share types between mock data and pages
3. **Add validation** - Validate mock data matches expected structure on load
4. **Centralize constants** - Define categories in one place and import everywhere

## Switch to Code Mode

Once this plan is approved, switch to **code mode** to implement the fixes.
