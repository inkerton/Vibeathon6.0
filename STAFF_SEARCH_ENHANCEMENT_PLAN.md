# Staff Search & Filter Enhancement Plan

## Current Implementation Analysis

### Existing Features ✅
The staff API (`GET /staff`) already supports:
- **Role filtering**: `?role=kitchen|reception|inventory|admin`
- **Status filtering**: `?is_active=true|false`
- **Text search**: `?search=<text>` (searches in name and email fields)

### Current Code Structure

**Backend Files:**
- `backend/src/routes/staff.routes.ts` - Route definitions
- `backend/src/controllers/staff.controller.ts` - Request handling & validation
- `backend/src/services/staff.service.ts` - Business logic & database queries

**Current Search Implementation:**
```typescript
// In staff.service.ts - getAllStaff method
if (filters?.search) {
  where.OR = [
    { name: { contains: filters.search, mode: 'insensitive' } },
    { email: { contains: filters.search, mode: 'insensitive' } },
  ];
}
```

## Enhancement Requirements

### User Request
Add ability to search/filter staff by:
1. **Name** ✅ (already implemented)
2. **Email** ✅ (already implemented)
3. **ID** ❌ (needs to be added)
4. **Role** ✅ (already implemented)

## Implementation Plan

### Step 1: Update StaffFilters Interface
**File:** `backend/src/services/staff.service.ts`

**Current:**
```typescript
export interface StaffFilters {
  role?: Role;
  is_active?: boolean;
  search?: string;
}
```

**Enhanced:**
```typescript
export interface StaffFilters {
  role?: Role;
  is_active?: boolean;
  search?: string;
  id?: string;  // NEW: Direct ID search
}
```

### Step 2: Enhance getAllStaff Method
**File:** `backend/src/services/staff.service.ts`

**Current Logic:**
- Filters by role (exact match)
- Filters by is_active (exact match)
- Searches name and email (partial match, case-insensitive)

**Enhanced Logic:**
Add ID filtering with two approaches:

**Approach A: Separate ID Filter (Recommended)**
```typescript
async getAllStaff(filters?: StaffFilters): Promise<User[]> {
  const where: any = {
    role: {
      not: Role.customer,
    },
  };

  // Apply role filter
  if (filters?.role) {
    where.role = filters.role;
  }

  // Apply status filter
  if (filters?.is_active !== undefined) {
    where.is_active = filters.is_active;
  }

  // Apply ID filter (exact match)
  if (filters?.id) {
    where.id = filters.id;
  }

  // Apply text search (name, email)
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const staff = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      is_active: true,
      auth_provider: true,
      created_at: true,
      updated_at: true,
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  return staff as User[];
}
```

**Approach B: Include ID in Search (Alternative)**
```typescript
// Include ID in the general search
if (filters?.search) {
  where.OR = [
    { id: { contains: filters.search, mode: 'insensitive' } },
    { name: { contains: filters.search, mode: 'insensitive' } },
    { email: { contains: filters.search, mode: 'insensitive' } },
  ];
}
```

**Recommendation:** Use **Approach A** for better API design:
- Allows precise ID lookup via `?id=<staff_id>`
- Keeps general search focused on name/email
- More intuitive for API consumers

### Step 3: Update Controller Validation
**File:** `backend/src/controllers/staff.controller.ts`

**Current:**
```typescript
async getAllStaff(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const filters: StaffFilters = {};
    
    if (req.query.role) {
      filters.role = req.query.role as Role;
    }
    
    if (req.query.is_active !== undefined) {
      filters.is_active = req.query.is_active === 'true';
    }
    
    if (req.query.search) {
      filters.search = req.query.search as string;
    }

    const staff = await staffService.getAllStaff(filters);
    // ...
  }
}
```

**Enhanced:**
```typescript
async getAllStaff(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const filters: StaffFilters = {};
    
    if (req.query.role) {
      filters.role = req.query.role as Role;
    }
    
    if (req.query.is_active !== undefined) {
      filters.is_active = req.query.is_active === 'true';
    }
    
    if (req.query.search) {
      filters.search = req.query.search as string;
    }
    
    // NEW: Add ID filter
    if (req.query.id) {
      filters.id = req.query.id as string;
    }

    const staff = await staffService.getAllStaff(filters);
    // ...
  }
}
```

### Step 4: No Route Changes Needed
The existing route `GET /staff` already accepts query parameters, so no changes needed in `staff.routes.ts`.

## API Usage Examples

### Current Usage ✅
```bash
# Get all staff
GET /staff

# Filter by role
GET /staff?role=kitchen

# Filter by status
GET /staff?is_active=true

# Search by name or email
GET /staff?search=john

# Combine filters
GET /staff?role=reception&is_active=true&search=jane
```

### Enhanced Usage ✨
```bash
# Search by ID (exact match)
GET /staff?id=cms1qusm2000ncp3y429h0b4m

# Combine ID with other filters
GET /staff?id=cms1qusm2000ncp3y429h0b4m&is_active=true

# All existing queries continue to work
GET /staff?search=john&role=kitchen
```

## Testing Plan

### Test Cases

1. **ID Filter - Exact Match**
   - Request: `GET /staff?id=<valid_staff_id>`
   - Expected: Returns single staff member with that ID
   - Expected: Returns empty array if ID not found

2. **ID Filter - Invalid ID**
   - Request: `GET /staff?id=invalid-id-format`
   - Expected: Returns empty array (no match)

3. **ID + Role Filter**
   - Request: `GET /staff?id=<staff_id>&role=kitchen`
   - Expected: Returns staff only if ID matches AND role is kitchen

4. **ID + Status Filter**
   - Request: `GET /staff?id=<staff_id>&is_active=false`
   - Expected: Returns staff only if ID matches AND is_active is false

5. **Search Still Works**
   - Request: `GET /staff?search=john`
   - Expected: Returns all staff with "john" in name or email

6. **Combined Filters**
   - Request: `GET /staff?role=reception&is_active=true&search=jane`
   - Expected: Returns active reception staff with "jane" in name/email

### Manual Testing Steps

1. **Setup:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Get Staff List:**
   ```bash
   curl -X GET http://localhost:5000/api/staff \
     -H "Authorization: Bearer <admin_token>"
   ```

3. **Test ID Search:**
   ```bash
   # Copy an ID from the list above
   curl -X GET "http://localhost:5000/api/staff?id=<staff_id>" \
     -H "Authorization: Bearer <admin_token>"
   ```

4. **Test Combined Filters:**
   ```bash
   curl -X GET "http://localhost:5000/api/staff?role=kitchen&is_active=true" \
     -H "Authorization: Bearer <admin_token>"
   ```

## Frontend Integration

### Current Frontend Code
**File:** `frontend/app/admin/staff/page.tsx`

The frontend already has search functionality but doesn't use query parameters yet. After backend enhancement, the frontend can be updated to:

```typescript
// Example: Search by ID
const searchStaffById = async (staffId: string) => {
  const response = await apiClient.get(`/staff?id=${staffId}`);
  return response.data.data;
};

// Example: Filter by role
const filterByRole = async (role: string) => {
  const response = await apiClient.get(`/staff?role=${role}`);
  return response.data.data;
};

// Example: Combined search
const searchStaff = async (filters: {
  search?: string;
  role?: string;
  is_active?: boolean;
  id?: string;
}) => {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.role) params.append('role', filters.role);
  if (filters.is_active !== undefined) params.append('is_active', String(filters.is_active));
  if (filters.id) params.append('id', filters.id);
  
  const response = await apiClient.get(`/staff?${params.toString()}`);
  return response.data.data;
};
```

## Implementation Summary

### Changes Required

1. **backend/src/services/staff.service.ts**
   - Add `id?: string` to `StaffFilters` interface
   - Add ID filtering logic in `getAllStaff` method

2. **backend/src/controllers/staff.controller.ts**
   - Add ID query parameter extraction in `getAllStaff` method

3. **No changes needed:**
   - Routes (already accepts query params)
   - Frontend (can use existing API, enhancement is backward compatible)

### Benefits

✅ **Backward Compatible** - All existing API calls continue to work
✅ **Flexible** - Supports multiple filter combinations
✅ **Efficient** - Uses Prisma's query optimization
✅ **Type Safe** - TypeScript interfaces ensure correctness
✅ **RESTful** - Follows REST API best practices for filtering

### Next Steps

1. Switch to `code` mode to implement the changes
2. Update `StaffFilters` interface
3. Enhance `getAllStaff` method with ID filtering
4. Update controller to extract ID parameter
5. Test all filter combinations
6. Update API documentation if needed
