# Customer Menu Filter Fix Plan

## Problem Analysis

The customer menu page (`/customer/menu/page.tsx`) shows all items regardless of which category filter is selected.

### Root Cause

The filtering logic has a critical flaw:

```typescript
// Current code - WRONG
const filteredMenu = useMemo(() => {
  return menuItems.filter((item) => {
    const query = searchQuery.toLowerCase();
    
    // Only filters by search query, NOT by category!
    return (
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  });
}, [menuItems, searchQuery]); // Missing 'category' dependency!
```

**Issues:**
1. The `filteredMenu` useMemo only filters by `searchQuery`
2. It doesn't filter by the selected `category`
3. The `category` is not in the dependency array
4. The API call includes category parameter, but if backend doesn't filter properly, frontend should handle it

## Solution

### Option 1: Frontend Filtering (Recommended)

Add category filtering to the `filteredMenu` useMemo:

```typescript
const filteredMenu = useMemo(() => {
  return menuItems.filter((item) => {
    // Filter by category first
    const matchesCategory = category === 'all' || item.category === category;
    
    // Then filter by search query
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query);
    
    return matchesCategory && matchesSearch;
  });
}, [menuItems, searchQuery, category]); // Add 'category' to dependencies
```

**Benefits:**
- Works regardless of backend filtering
- Instant filtering (no API call needed)
- Better user experience
- Handles edge cases

### Option 2: Backend-Only Filtering

Remove the `fetchMenu()` call on category change and rely entirely on frontend filtering:

```typescript
// Remove this useEffect
useEffect(() => {
  fetchMenu();
}, [category]); // ❌ Remove this

// Fetch once on mount
useEffect(() => {
  fetchMenu();
}, []); // ✅ Empty dependency array

// Then use Option 1's filtering logic
```

**Benefits:**
- Fewer API calls
- Faster category switching
- Simpler code

### Option 3: Hybrid Approach

Keep backend filtering but add frontend filtering as backup:

```typescript
const filteredMenu = useMemo(() => {
  return menuItems.filter((item) => {
    // Backend should have filtered, but double-check
    const matchesCategory = category === 'all' || item.category === category;
    
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || 
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query);
    
    return matchesCategory && matchesSearch;
  });
}, [menuItems, searchQuery, category]);
```

## Recommended Implementation

**Use Option 2 (Backend-Only Filtering with Frontend Backup)**

### Step 1: Update fetchMenu to fetch all items once

```typescript
useEffect(() => {
  fetchMenu(); // Fetch all items once on mount
}, []); // Empty dependency array
```

### Step 2: Update filteredMenu with proper filtering

```typescript
const filteredMenu = useMemo(() => {
  return menuItems.filter((item) => {
    // Category filter
    const matchesCategory = category === 'all' || item.category === category;
    
    // Search filter
    if (!searchQuery) {
      return matchesCategory;
    }
    
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query);
    
    return matchesCategory && matchesSearch;
  });
}, [menuItems, searchQuery, category]);
```

### Step 3: Update fetchMenu to remove category parameter

```typescript
const fetchMenu = async () => {
  setLoading(true);
  
  try {
    // Fetch all available items
    const response = await apiClient.get('/menu?available=true');
    
    // ... rest of the code
  } catch (err) {
    // ... error handling
  } finally {
    setLoading(false);
  }
};
```

## Testing Plan

1. **Category Filtering**
   - Select "Appetizer" - should show only appetizers
   - Select "Main Course" - should show only main courses
   - Select "Dessert" - should show only desserts
   - Select "Beverage" - should show only beverages
   - Select "All" - should show all items

2. **Search Filtering**
   - Search with category "All" - should search across all items
   - Search with category "Appetizer" - should search only in appetizers
   - Clear search - should show all items in selected category

3. **Combined Filtering**
   - Select category + search - should show items matching both filters
   - Change category while search is active - should update results
   - Clear search while category is selected - should show all items in category

4. **Edge Cases**
   - Empty search query - should show all items in category
   - No items in category - should show empty state
   - Search with no results - should show "no dishes found"

## Files to Modify

- `frontend/app/customer/menu/page.tsx`

## Code Changes Required

### Change 1: Remove category dependency from fetchMenu

```typescript
// BEFORE
useEffect(() => {
  fetchMenu();
}, [category]); // ❌ Causes unnecessary API calls

// AFTER
useEffect(() => {
  fetchMenu();
}, []); // ✅ Fetch once on mount
```

### Change 2: Update fetchMenu to fetch all items

```typescript
// BEFORE
const params = category !== 'all' 
  ? `?category=${category}&available=true` 
  : '?available=true';

// AFTER
const params = '?available=true'; // Always fetch all available items
```

### Change 3: Add category filtering to filteredMenu

```typescript
// BEFORE
const filteredMenu = useMemo(() => {
  return menuItems.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  });
}, [menuItems, searchQuery]); // ❌ Missing category

// AFTER
const filteredMenu = useMemo(() => {
  return menuItems.filter((item) => {
    // Category filter
    const matchesCategory = category === 'all' || item.category === category;
    
    // Search filter
    if (!searchQuery) {
      return matchesCategory;
    }
    
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query);
    
    return matchesCategory && matchesSearch;
  });
}, [menuItems, searchQuery, category]); // ✅ All dependencies
```

## Performance Impact

**Before:**
- API call on every category change
- Network latency for each filter
- Unnecessary server load

**After:**
- Single API call on mount
- Instant category switching
- Better user experience
- Reduced server load

## Success Criteria

✅ Category filters work correctly  
✅ Search works within selected category  
✅ "All" category shows all items  
✅ No unnecessary API calls  
✅ Instant filter response  
✅ Empty states handled properly  

## Next Steps

1. Switch to code mode
2. Implement the changes
3. Test all filter combinations
4. Verify no regression in search functionality
5. Check network tab for reduced API calls
