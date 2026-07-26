# Menu API Backend-Frontend Alignment Plan

## Problem Analysis

After analyzing the backend and frontend code for menu management, there are **critical field name mismatches** between the API and the frontend that will cause errors.

## Field Name Mismatches

### Backend (Database Schema & API)
```typescript
{
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;        // ❌ snake_case
  is_available: boolean;           // ❌ snake_case
  preparation_time: number;        // ❌ snake_case (assumed from schema)
  created_at: Date;                // ❌ snake_case
  updated_at: Date;                // ❌ snake_case
}
```

### Frontend (Expected Format)
```typescript
{
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string | null;         // ✅ camelCase
  isAvailable: boolean;            // ✅ camelCase
  preparationTime: number;         // ✅ camelCase
  createdAt: string;               // ✅ camelCase
}
```

### Specific Mismatches

| Backend Field | Frontend Field | Status |
|--------------|----------------|--------|
| `image_url` | `imageUrl` | ❌ Mismatch |
| `is_available` | `isAvailable` | ❌ Mismatch |
| `preparation_time` | `preparationTime` | ❌ Mismatch |
| `created_at` | `createdAt` | ❌ Mismatch |
| `updated_at` | `updatedAt` | ❌ Mismatch |

## Current API Endpoints

### Backend Routes (`/api/v1/menu`)

1. **GET /menu** - Get all menu items
   - Response: `{ status: 'success', data: MenuItem[] }`
   - Query: `?includeUnavailable=true`

2. **GET /menu/:id** - Get single menu item
   - Response: `{ status: 'success', data: MenuItem }`

3. **POST /menu** - Create menu item (Admin only)
   - Request body validation:
     ```typescript
     {
       name: string (min 2 chars)
       description: string (min 10 chars)
       price: number (positive)
       category: string (min 2 chars)
       image_url?: string (URL format)
     }
     ```
   - Response: `{ status: 'success', data: MenuItem }`

4. **PATCH /menu/:id** - Update menu item (Admin only)
   - Request body (all optional):
     ```typescript
     {
       name?: string
       description?: string
       price?: number
       category?: string
       image_url?: string
       is_available?: boolean
     }
     ```
   - Response: `{ status: 'success', data: MenuItem }`

5. **DELETE /menu/:id** - Delete menu item (Admin only)
   - Response: `{ status: 'success', data: { message: string } }`

6. **PATCH /menu/:id/availability** - Toggle availability (Admin/Kitchen)
   - Request body:
     ```typescript
     {
       is_available: boolean
     }
     ```
   - Response: `{ status: 'success', data: MenuItem }`

7. **GET /menu/by-category** - Get menu grouped by category
   - Response: `{ status: 'success', data: Record<string, MenuItem[]> }`

## Frontend API Calls

### Current Frontend Requests

1. **GET /menu** (line 62)
   ```typescript
   const response = await apiClient.get('/menu');
   const items = response.data?.data || response.data || [];
   ```

2. **POST /menu** (line 118)
   ```typescript
   await apiClient.post('/menu', {
     name: formData.name,
     description: formData.description,
     price: parseFloat(formData.price),
     category: formData.category,
     imageUrl: formData.imageUrl || null,        // ❌ Wrong field name
     preparationTime: parseInt(formData.preparationTime), // ❌ Wrong field name
   });
   ```

3. **PATCH /menu/:id** (line 114)
   ```typescript
   await apiClient.patch(`/menu/${editingItem.id}`, {
     name: formData.name,
     description: formData.description,
     price: parseFloat(formData.price),
     category: formData.category,
     imageUrl: formData.imageUrl || null,        // ❌ Wrong field name
     preparationTime: parseInt(formData.preparationTime), // ❌ Wrong field name
   });
   ```

4. **DELETE /menu/:id** (line 129)
   ```typescript
   await apiClient.delete(`/menu/${itemId}`);
   ```

5. **PATCH /menu/:id/availability** (line 138)
   ```typescript
   await apiClient.patch(`/menu/${itemId}/availability`, {
     isAvailable: !currentStatus,  // ❌ Wrong field name (should be is_available)
   });
   ```

## Issues Identified

### Critical Issues (Will Cause Errors)

1. **Create Menu Item** - Frontend sends `imageUrl` and `preparationTime`, backend expects `image_url` and doesn't validate `preparation_time`
2. **Update Menu Item** - Same field name mismatch
3. **Toggle Availability** - Frontend sends `isAvailable`, backend expects `is_available`
4. **Response Parsing** - Frontend expects camelCase, backend returns snake_case

### Backend Schema Issues

1. **Missing Field**: `preparation_time` is not in the validation schema but frontend sends it
2. **Field Not Stored**: Backend doesn't handle `preparation_time` in create/update operations

## Solution Options

### Option 1: Update Backend to Use camelCase (Recommended)

**Pros:**
- JavaScript/TypeScript convention
- Matches frontend expectations
- More consistent with modern APIs

**Cons:**
- Requires database migration
- More extensive changes

### Option 2: Update Frontend to Use snake_case

**Pros:**
- Smaller changes
- Matches database convention

**Cons:**
- Goes against JavaScript conventions
- Less maintainable

### Option 3: Add Transformation Layer (Quick Fix)

**Pros:**
- No database changes
- Minimal code changes
- Can be done incrementally

**Cons:**
- Additional overhead
- Two naming conventions in codebase

## Recommended Solution: Option 3 (Transformation Layer)

Add a transformation layer in the backend controller to convert between snake_case and camelCase.

## Implementation Plan

### Phase 1: Backend Fixes (High Priority)

#### Step 1: Add preparation_time to Database Schema
**File**: `backend/prisma/schema.prisma`
- Add `preparation_time` field to MenuItem model
- Run migration

#### Step 2: Update Validation Schemas
**File**: `backend/src/controllers/menu.controller.ts`
- Add `preparation_time` to `createMenuItemSchema`
- Add `preparation_time` to `updateMenuItemSchema`

#### Step 3: Add Response Transformation
**File**: `backend/src/controllers/menu.controller.ts`
- Create helper function to transform snake_case to camelCase
- Apply to all response data

#### Step 4: Update Request Handling
**File**: `backend/src/controllers/menu.controller.ts`
- Accept both camelCase and snake_case in requests
- Transform camelCase to snake_case before validation

### Phase 2: Frontend Fixes (Medium Priority)

#### Step 1: Fix Toggle Availability Request
**File**: `frontend/app/admin/menu/page.tsx`
- Change `isAvailable` to `is_available` in request body
- OR wait for backend transformation layer

#### Step 2: Add Response Transformation (if needed)
**File**: `frontend/app/admin/menu/page.tsx`
- Transform snake_case responses to camelCase
- OR wait for backend transformation layer

### Phase 3: Testing (High Priority)

1. **Create Menu Item**
   - Test with all fields
   - Test with optional fields
   - Verify preparation_time is saved

2. **Update Menu Item**
   - Test updating each field
   - Test with preparation_time

3. **Toggle Availability**
   - Test enabling/disabling items
   - Verify real-time updates

4. **Delete Menu Item**
   - Test deletion
   - Verify cascade effects

## Detailed Implementation Steps

### Backend Changes

#### 1. Update Prisma Schema
```prisma
model MenuItem {
  id               String   @id @default(uuid())
  name             String   @unique
  description      String
  price            Float
  category         String
  image_url        String?
  is_available     Boolean  @default(true)
  preparation_time Int      @default(15)  // Add this field
  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt
  
  // ... rest of relations
}
```

#### 2. Update Controller Validation
```typescript
const createMenuItemSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  price: z.number().positive(),
  category: z.string().min(2),
  image_url: z.string().url().optional(),
  preparation_time: z.number().int().positive().default(15), // Add this
});
```

#### 3. Add Transformation Helper
```typescript
function transformMenuItemResponse(item: any) {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    category: item.category,
    imageUrl: item.image_url,
    isAvailable: item.is_available,
    preparationTime: item.preparation_time,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}
```

#### 4. Update Service Methods
```typescript
async createMenuItem(data: {
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  preparation_time?: number; // Add this
}) {
  // ... existing code
  const menuItem = await prisma.menuItem.create({
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      category: data.category,
      image_url: data.image_url,
      preparation_time: data.preparation_time || 15, // Add this
      is_available: true,
    },
  });
  return menuItem;
}
```

### Frontend Changes

#### 1. Fix Toggle Availability
```typescript
const handleToggleAvailability = async (itemId: string, currentStatus: boolean) => {
  try {
    await apiClient.patch(`/menu/${itemId}/availability`, {
      is_available: !currentStatus, // Change from isAvailable
    });
    // ... rest of code
  }
};
```

#### 2. Update Create/Update Payload (if backend doesn't transform)
```typescript
const payload = {
  name: formData.name,
  description: formData.description,
  price: parseFloat(formData.price),
  category: formData.category,
  image_url: formData.imageUrl || null, // Change from imageUrl
  preparation_time: parseInt(formData.preparationTime), // Change from preparationTime
};
```

## Testing Checklist

### Backend Tests
- [ ] Create menu item with all fields
- [ ] Create menu item with optional fields
- [ ] Update menu item
- [ ] Delete menu item
- [ ] Toggle availability
- [ ] Get all menu items
- [ ] Get menu by category
- [ ] Verify preparation_time is saved and retrieved

### Frontend Tests
- [ ] Create menu item form submission
- [ ] Update menu item form submission
- [ ] Delete menu item
- [ ] Toggle availability button
- [ ] Menu items display correctly
- [ ] Category filtering works
- [ ] Image display works

### Integration Tests
- [ ] End-to-end create flow
- [ ] End-to-end update flow
- [ ] End-to-end delete flow
- [ ] Real-time availability updates

## Priority Order

1. **Critical (Do First)**
   - Add preparation_time to database schema
   - Fix toggle availability field name mismatch
   - Add preparation_time to backend validation

2. **High Priority**
   - Add response transformation in backend
   - Update frontend to handle responses correctly
   - Test all CRUD operations

3. **Medium Priority**
   - Add request transformation in backend
   - Refactor frontend to use consistent naming
   - Add comprehensive error handling

4. **Low Priority**
   - Add field-level validation feedback
   - Improve error messages
   - Add loading states for all operations

## Success Criteria

✅ All menu CRUD operations work without errors
✅ Field names are consistent between frontend and backend
✅ preparation_time is properly saved and retrieved
✅ Toggle availability works correctly
✅ No console errors related to undefined fields
✅ All existing functionality continues to work

## Next Steps

1. Review and approve this plan
2. Switch to `code` mode to implement changes
3. Start with Phase 1 (Backend Fixes)
4. Test each change before moving to next
5. Deploy and verify in production
