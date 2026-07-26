# Menu Delete & Optimistic UI Fix Plan

## Issues Identified

### Issue 1: Delete API Failing (500 Error)

**Error Message:**
```
Foreign key constraint violated: `OrderItem_menu_item_id_fkey (index)`
```

**Root Cause:**
The `deleteMenuItem` service (line 116-136 in `backend/src/services/menu.service.ts`) only deletes `RecipeItem` records but doesn't handle `OrderItem` records that reference the menu item.

**Current Code:**
```typescript
async deleteMenuItem(id: string) {
  // Only deletes RecipeItems
  await prisma.recipeItem.deleteMany({
    where: { menu_item_id: id },
  });
  
  // Fails here if OrderItems exist
  await prisma.menuItem.delete({
    where: { id },
  });
}
```

### Issue 2: No Optimistic UI Updates

After API calls (create/edit/delete/toggle), the UI waits for the server response before updating, causing perceived lag.

## Solutions

### Solution 1: Fix Backend Delete Service

**Option A: Delete OrderItems (Not Recommended)**
Deleting order history is bad practice - loses business data.

**Option B: Soft Delete (Recommended)**
Instead of hard deleting, mark the item as deleted/archived:

```typescript
async deleteMenuItem(id: string) {
  const menuItem = await prisma.menuItem.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          order_items: true,
        },
      },
    },
  });

  if (!menuItem) {
    throw new AppError('Menu item not found', 404);
  }

  // Check if item has been ordered
  if (menuItem._count.order_items > 0) {
    // Soft delete - mark as unavailable and archived
    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        is_available: false,
        is_archived: true, // Need to add this field to schema
      },
    });
    
    return { 
      message: 'Menu item archived (has order history)',
      archived: true,
      item: updated
    };
  }

  // Hard delete if no orders exist
  await prisma.recipeItem.deleteMany({
    where: { menu_item_id: id },
  });

  await prisma.menuItem.delete({
    where: { id },
  });

  return { 
    message: 'Menu item deleted successfully',
    archived: false
  };
}
```

**Option C: Prevent Delete (Simplest)**
Don't allow deletion if item has orders:

```typescript
async deleteMenuItem(id: string) {
  const menuItem = await prisma.menuItem.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          order_items: true,
        },
      },
    },
  });

  if (!menuItem) {
    throw new AppError('Menu item not found', 404);
  }

  // Prevent deletion if item has been ordered
  if (menuItem._count.order_items > 0) {
    throw new AppError(
      'Cannot delete menu item that has been ordered. Disable it instead.',
      400
    );
  }

  // Delete related recipe items
  await prisma.recipeItem.deleteMany({
    where: { menu_item_id: id },
  });

  // Delete menu item
  await prisma.menuItem.delete({
    where: { id },
  });

  return { message: 'Menu item deleted successfully' };
}
```

**Recommendation:** Use Option C (prevent delete) - simplest and safest.

### Solution 2: Implement Optimistic UI with useOptimistic

React 19's `useOptimistic` hook provides built-in optimistic updates.

**Implementation for Menu Page:**

```typescript
'use client';

import { useEffect, useState, useMemo, useCallback, useOptimistic } from 'react';

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [optimisticItems, setOptimisticItems] = useOptimistic(
    menuItems,
    (state, optimisticValue: { action: string; item?: MenuItem; id?: string }) => {
      switch (optimisticValue.action) {
        case 'add':
          return [...state, optimisticValue.item!];
        case 'update':
          return state.map(item => 
            item.id === optimisticValue.item!.id ? optimisticValue.item! : item
          );
        case 'delete':
          return state.filter(item => item.id !== optimisticValue.id);
        case 'toggle':
          return state.map(item =>
            item.id === optimisticValue.id
              ? { ...item, isAvailable: !item.isAvailable }
              : item
          );
        default:
          return state;
      }
    }
  );

  // Use optimisticItems in MaterialReactTable instead of menuItems
  const columns = useMemo<MRT_ColumnDef<MenuItem>[]>(
    () => [...],
    [...]
  );

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        imageUrl: formData.imageUrl || null,
        preparationTime: parseInt(formData.preparationTime),
      };

      if (editingItem) {
        // Optimistic update
        setOptimisticItems({
          action: 'update',
          item: { ...editingItem, ...payload }
        });
        
        await apiClient.patch(`/menu/${editingItem.id}`, payload);
        setToast({ show: true, message: 'Menu item updated successfully', type: 'success' });
      } else {
        // Optimistic add
        const tempId = `temp-${Date.now()}`;
        setOptimisticItems({
          action: 'add',
          item: { id: tempId, ...payload, isAvailable: true, createdAt: new Date().toISOString() }
        });
        
        await apiClient.post('/menu', payload);
        setToast({ show: true, message: 'Menu item created successfully', type: 'success' });
      }

      setIsModalOpen(false);
      await fetchMenuItems(); // Sync with server
    } catch (err: any) {
      setToast({ show: true, message: err.message || 'Failed to save menu item', type: 'error' });
      await fetchMenuItems(); // Revert on error
    } finally {
      setSubmitting(false);
    }
  }, [editingItem, formData, fetchMenuItems]);

  const handleDelete = useCallback(async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      // Optimistic delete
      setOptimisticItems({ action: 'delete', id: itemId });
      
      await apiClient.delete(`/menu/${itemId}`);
      setToast({ show: true, message: 'Menu item deleted successfully', type: 'success' });
      await fetchMenuItems(); // Sync with server
    } catch (err: any) {
      setToast({ show: true, message: err.message || 'Failed to delete menu item', type: 'error' });
      await fetchMenuItems(); // Revert on error
    }
  }, [fetchMenuItems]);

  const handleToggleAvailability = useCallback(async (itemId: string, currentStatus: boolean) => {
    try {
      // Optimistic toggle
      setOptimisticItems({ action: 'toggle', id: itemId });
      
      await apiClient.patch(`/menu/${itemId}/availability`, {
        isAvailable: !currentStatus,
      });
      setToast({ 
        show: true, 
        message: `Menu item ${!currentStatus ? 'enabled' : 'disabled'} successfully`, 
        type: 'success' 
      });
      await fetchMenuItems(); // Sync with server
    } catch (err: any) {
      setToast({ show: true, message: err.message || 'Failed to update availability', type: 'error' });
      await fetchMenuItems(); // Revert on error
    }
  }, [fetchMenuItems]);

  return (
    <div className="space-y-6">
      {/* ... */}
      <Card>
        <MaterialReactTable
          columns={columns}
          data={optimisticItems} {/* Use optimistic state */}
          {/* ... other props */}
        />
      </Card>
    </div>
  );
}
```

## Implementation Steps

### Phase 1: Fix Backend Delete (Priority: HIGH)

1. Update `backend/src/services/menu.service.ts` - `deleteMenuItem` method
2. Add check for existing orders
3. Return appropriate error message
4. Test delete API with items that have orders

### Phase 2: Implement Optimistic UI (Priority: MEDIUM)

1. Add `useOptimistic` import to menu page
2. Create optimistic state wrapper
3. Update all mutation handlers to use optimistic updates
4. Update MaterialReactTable to use `optimisticItems`
5. Ensure proper error handling and reversion

### Phase 3: Frontend Error Handling (Priority: MEDIUM)

1. Update delete handler to show specific error for items with orders
2. Add user-friendly message suggesting to disable instead
3. Update UI to show "Disable" button more prominently for items with orders

## Testing Checklist

### Backend Delete Fix
- [ ] Delete menu item with no orders → Success
- [ ] Delete menu item with orders → Error with helpful message
- [ ] Error message suggests disabling instead
- [ ] Disable functionality works correctly

### Optimistic UI
- [ ] Create item → Appears immediately, then syncs
- [ ] Edit item → Updates immediately, then syncs
- [ ] Delete item → Disappears immediately, then syncs
- [ ] Toggle availability → Updates immediately, then syncs
- [ ] On error → Reverts to previous state
- [ ] Toast messages appear at correct times

## Files to Modify

1. **Backend:**
   - `/backend/src/services/menu.service.ts` (lines 116-136)

2. **Frontend:**
   - `/frontend/app/admin/menu/page.tsx` (add useOptimistic)

## Recommended Approach

**For immediate fix:** Implement Phase 1 (backend delete fix) first - this is blocking functionality.

**For better UX:** Then implement Phase 2 (optimistic UI) - this improves perceived performance.

**Alternative to useOptimistic:** If React 19 features aren't available, use manual optimistic updates with state management.
