# Menu Page Performance Fix Plan

## Problem Analysis

The admin menu page (`/admin/menu/page.tsx`) has slow data fetching and sometimes fails to load data. 

### Root Causes Identified

1. **Redundant API Calls**
   - Optimistic update → API call → Full data refetch
   - Every action triggers a complete data reload
   - No caching mechanism

2. **Re-render Issues**
   - Multiple useState hooks causing cascading re-renders
   - useCallback dependencies not optimized
   - MaterialReactTable re-renders on every data change

3. **No Loading States Between Actions**
   - User sees stale data during refetch
   - No indication of background updates

4. **Network Inefficiency**
   - Fetching all menu items after every single operation
   - No incremental updates
   - No request deduplication

## Proposed Solutions

### Option 1: React Query Implementation (Recommended)

**Benefits:**
- Automatic caching and background refetching
- Request deduplication
- Stale-while-revalidate pattern
- Optimistic updates with automatic rollback on error
- Built-in loading and error states

**Implementation:**
```typescript
// Install: npm install @tanstack/react-query

// 1. Setup QueryClient in layout
// 2. Use useQuery for data fetching
// 3. Use useMutation for CRUD operations
// 4. Remove manual refetch calls
```

**Changes Required:**
- Add QueryClientProvider to admin layout
- Replace useState + useEffect with useQuery
- Replace manual API calls with useMutation
- Remove fetchMenuItems calls after mutations
- Trust optimistic updates (only revert on error)

### Option 2: SWR Implementation (Alternative)

**Benefits:**
- Similar to React Query but lighter
- Built-in cache and revalidation
- Simpler API

**Implementation:**
```typescript
// Install: npm install swr

// Use useSWR hook for data fetching
// Use mutate for optimistic updates
```

### Option 3: Optimized Current Approach (Quick Fix)

**Benefits:**
- No new dependencies
- Minimal code changes
- Quick to implement

**Changes:**
1. Remove refetch after successful optimistic updates
2. Only refetch on error (to revert)
3. Add request debouncing
4. Implement local cache with timestamp
5. Use AbortController to cancel pending requests

## Recommended Implementation Plan

### Phase 1: Quick Wins (Immediate)

1. **Remove Redundant Refetches**
   - Remove `await fetchMenuItems()` after successful mutations
   - Only refetch on error to revert optimistic update
   - Trust the optimistic update for immediate UI feedback

2. **Add Request Caching**
   - Cache menu items in sessionStorage/localStorage
   - Check cache first before API call
   - Set cache expiry (e.g., 5 minutes)

3. **Optimize Re-renders**
   - Memoize expensive computations
   - Use React.memo for child components
   - Reduce useCallback dependencies

### Phase 2: React Query Migration (Recommended Long-term)

1. **Setup React Query**
   ```bash
   npm install @tanstack/react-query
   ```

2. **Create Query Client**
   ```typescript
   // app/admin/layout.tsx
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
   
   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 5 * 60 * 1000, // 5 minutes
         cacheTime: 10 * 60 * 1000, // 10 minutes
         refetchOnWindowFocus: false,
       },
     },
   });
   ```

3. **Convert to useQuery**
   ```typescript
   const { data: menuItems, isLoading, error } = useQuery({
     queryKey: ['menuItems'],
     queryFn: async () => {
       const response = await apiClient.get('/menu?includeUnavailable=true');
       return response.data?.data || response.data || [];
     },
   });
   ```

4. **Use Mutations with Optimistic Updates**
   ```typescript
   const createMutation = useMutation({
     mutationFn: (data) => apiClient.post('/menu', data),
     onMutate: async (newItem) => {
       // Cancel outgoing refetches
       await queryClient.cancelQueries({ queryKey: ['menuItems'] });
       
       // Snapshot previous value
       const previousItems = queryClient.getQueryData(['menuItems']);
       
       // Optimistically update
       queryClient.setQueryData(['menuItems'], (old) => [...old, newItem]);
       
       return { previousItems };
     },
     onError: (err, newItem, context) => {
       // Rollback on error
       queryClient.setQueryData(['menuItems'], context.previousItems);
     },
     onSettled: () => {
       // Refetch to ensure sync
       queryClient.invalidateQueries({ queryKey: ['menuItems'] });
     },
   });
   ```

### Phase 3: Additional Optimizations

1. **Implement Virtual Scrolling**
   - Use react-window or react-virtual for large datasets
   - Only render visible rows

2. **Add Pagination**
   - Backend pagination support
   - Reduce initial load size

3. **Image Lazy Loading**
   - Use Intersection Observer
   - Load images only when visible

4. **Debounce Search/Filter**
   - Prevent excessive filtering operations
   - Use lodash.debounce or custom hook

## Implementation Priority

### High Priority (Do First)
1. ✅ Remove redundant refetches after mutations
2. ✅ Add basic caching with sessionStorage
3. ✅ Fix optimistic update logic (don't refetch on success)

### Medium Priority (Next Sprint)
1. Implement React Query
2. Add proper error boundaries
3. Optimize MaterialReactTable configuration

### Low Priority (Future Enhancement)
1. Virtual scrolling for large datasets
2. Backend pagination
3. Image optimization/CDN

## Code Changes Required

### File: `frontend/app/admin/menu/page.tsx`

**Changes:**
1. Remove `await fetchMenuItems()` from:
   - `handleSubmit` (after successful API call)
   - `handleDelete` (after successful API call)
   - `handleToggleAvailability` (after successful API call)

2. Only call `fetchMenuItems()` on error to revert optimistic update

3. Add caching layer:
   ```typescript
   const CACHE_KEY = 'menu_items_cache';
   const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
   
   const getCachedData = () => {
     const cached = sessionStorage.getItem(CACHE_KEY);
     if (cached) {
       const { data, timestamp } = JSON.parse(cached);
       if (Date.now() - timestamp < CACHE_DURATION) {
         return data;
       }
     }
     return null;
   };
   
   const setCachedData = (data) => {
     sessionStorage.setItem(CACHE_KEY, JSON.stringify({
       data,
       timestamp: Date.now()
     }));
   };
   ```

4. Update fetchMenuItems to use cache:
   ```typescript
   const fetchMenuItems = async (forceRefresh = false) => {
     if (!forceRefresh) {
       const cached = getCachedData();
       if (cached) {
         setMenuItems(cached);
         setLoading(false);
         // Fetch in background to update cache
         fetchInBackground();
         return;
       }
     }
     // ... existing fetch logic
   };
   ```

## Testing Plan

1. **Performance Testing**
   - Measure initial load time
   - Measure time for CRUD operations
   - Check network tab for redundant requests

2. **Functionality Testing**
   - Create menu item
   - Update menu item
   - Delete menu item
   - Toggle availability
   - Filter by category
   - Search functionality

3. **Edge Cases**
   - Network failure during operation
   - Concurrent updates
   - Large dataset (100+ items)
   - Slow network simulation

## Success Metrics

- Initial load time: < 1 second
- CRUD operation feedback: Immediate (optimistic)
- Network requests: Reduced by 70%
- No empty states on refresh
- Smooth user experience with no loading flickers

## Rollback Plan

If React Query causes issues:
1. Keep the quick fixes (remove redundant refetches)
2. Revert to optimized current approach
3. Add manual caching layer
4. Consider SWR as alternative

## Next Steps

1. Implement Phase 1 quick wins immediately
2. Test thoroughly in development
3. Deploy to staging
4. Monitor performance metrics
5. Plan Phase 2 React Query migration
