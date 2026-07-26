# Frontend Staff API Integration Plan

## Problem Analysis

The frontend staff management page has multiple mismatches with the backend API implementation. This plan addresses all discrepancies and ensures proper integration.

## Current Issues

### 1. API Endpoint Mismatches

**Frontend (Current):**
```typescript
GET  /auth/staff              // ❌ Wrong endpoint
POST /auth/register           // ❌ Wrong endpoint
PATCH /auth/staff/:id/status  // ❌ Wrong endpoint
```

**Backend (Actual):**
```typescript
GET    /staff                 // ✅ Correct
POST   /staff                 // ✅ Correct
PATCH  /staff/:id/status      // ✅ Correct
GET    /staff/:id             // Available
PATCH  /staff/:id             // Available
DELETE /staff/:id             // Available
```

### 2. Field Name Mismatches

**Frontend Interface (Current):**
```typescript
interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;      // ❌ camelCase
  createdAt: string;      // ❌ camelCase
}
```

**Backend Response (Actual):**
```typescript
{
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;     // ✅ snake_case
  auth_provider: string;
  created_at: string;     // ✅ snake_case
  updated_at: string;
}
```

### 3. Response Structure Mismatch

**Frontend Expectation (Current):**
```typescript
const response = await apiClient.get('/auth/staff');
setStaff(response.data || []);  // Expects direct array
```

**Backend Response (Actual):**
```typescript
{
  status: "success",
  data: [...]  // Array is nested in 'data' property
}
```

### 4. Request Body Mismatches

**Create Staff - Frontend (Current):**
```typescript
await apiClient.post('/auth/register', {
  name: string,
  email: string,
  phone: string,
  password: string,
  role: string,
  isStaff: true  // ❌ Not needed
});
```

**Create Staff - Backend (Expected):**
```typescript
POST /staff
{
  name: string,
  email: string,
  phone?: string,
  password: string,
  role: 'reception' | 'kitchen' | 'inventory' | 'admin'
}
```

**Toggle Status - Frontend (Current):**
```typescript
await apiClient.patch(`/auth/staff/${staffId}/status`, {
  isActive: !currentStatus  // ❌ Backend doesn't expect body
});
```

**Toggle Status - Backend (Expected):**
```typescript
PATCH /staff/:id/status
// No request body needed - just toggles current status
```

## Implementation Plan

### Step 1: Update Frontend Staff Interface

**File:** `frontend/app/admin/staff/page.tsx`

**Changes:**
1. Update Staff interface to match backend response
2. Add field mapping/transformation
3. Handle nested response structure

**New Interface:**
```typescript
// Backend response type
interface StaffResponse {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'reception' | 'kitchen' | 'inventory' | 'admin';
  is_active: boolean;
  auth_provider: string;
  created_at: string;
  updated_at: string;
}

// Frontend display type (optional - for easier use)
interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

// Transformation function
function transformStaffResponse(data: StaffResponse): Staff {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone || '',
    role: data.role,
    isActive: data.is_active,
    createdAt: data.created_at,
  };
}
```

### Step 2: Fix API Endpoints

**File:** `frontend/app/admin/staff/page.tsx`

**Changes:**

```typescript
// ❌ OLD
const response = await apiClient.get('/auth/staff');
setStaff(response.data || []);

// ✅ NEW
const response = await apiClient.get('/staff');
const staffData = response.data.data || []; // Handle nested structure
setStaff(staffData.map(transformStaffResponse));
```

```typescript
// ❌ OLD
await apiClient.post('/auth/register', {
  ...formData,
  isStaff: true,
});

// ✅ NEW
await apiClient.post('/staff', {
  name: formData.name,
  email: formData.email,
  phone: formData.phone,
  password: formData.password,
  role: formData.role,
});
```

```typescript
// ❌ OLD
await apiClient.patch(`/auth/staff/${staffId}/status`, {
  isActive: !currentStatus,
});

// ✅ NEW
await apiClient.patch(`/staff/${staffId}/status`);
// No body needed - backend toggles automatically
```

### Step 3: Update Mock API Client

**File:** `frontend/lib/mock-api-client.ts`

**Current Mock Endpoints:**
```typescript
// Staff endpoints (need to verify these match backend)
mockState.on('get', '/auth/staff', () => { ... });
mockState.on('post', '/auth/staff', () => { ... });
mockState.on('patch', '/auth/staff/:id', () => { ... });
mockState.on('delete', '/auth/staff/:id', () => { ... });
```

**Required Changes:**
1. Change endpoints from `/auth/staff` to `/staff`
2. Update response structure to match backend format
3. Fix field names (snake_case)
4. Update toggle status endpoint behavior

**New Mock Endpoints:**
```typescript
// GET /staff - List all staff
mockState.on('get', '/staff', (config) => {
  const staff = mockState.getStaff();
  return [200, {
    status: 'success',
    data: staff.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      role: s.role,
      is_active: s.isActive,  // Transform to snake_case
      auth_provider: 'local',
      created_at: s.createdAt,
      updated_at: s.createdAt,
    }))
  }];
});

// POST /staff - Create staff
mockState.on('post', '/staff', (config) => {
  const data = JSON.parse(config.data);
  const newStaff = mockState.createStaff({
    name: data.name,
    email: data.email,
    phone: data.phone,
    password: data.password,
    role: data.role,
  });
  return [201, {
    status: 'success',
    message: 'Staff member created successfully',
    data: {
      id: newStaff.id,
      name: newStaff.name,
      email: newStaff.email,
      phone: newStaff.phone,
      role: newStaff.role,
      is_active: newStaff.isActive,
      auth_provider: 'local',
      created_at: newStaff.createdAt,
      updated_at: newStaff.createdAt,
    }
  }];
});

// PATCH /staff/:id/status - Toggle status
mockState.on('patch', /\/staff\/([^/]+)\/status/, (config) => {
  const id = config.url!.match(/\/staff\/([^/]+)\/status/)![1];
  const updatedStaff = mockState.toggleStaffStatus(id);
  return [200, {
    status: 'success',
    message: `Staff member ${updatedStaff.isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      id: updatedStaff.id,
      name: updatedStaff.name,
      email: updatedStaff.email,
      phone: updatedStaff.phone,
      role: updatedStaff.role,
      is_active: updatedStaff.isActive,
      auth_provider: 'local',
      created_at: updatedStaff.createdAt,
      updated_at: updatedStaff.createdAt,
    }
  }];
});

// GET /staff/:id - Get staff by ID
mockState.on('get', /\/staff\/([^/]+)$/, (config) => {
  const id = config.url!.match(/\/staff\/([^/]+)$/)![1];
  const staff = mockState.getStaffById(id);
  if (!staff) {
    return [404, { status: 'error', message: 'Staff member not found' }];
  }
  return [200, {
    status: 'success',
    data: {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
      is_active: staff.isActive,
      auth_provider: 'local',
      created_at: staff.createdAt,
      updated_at: staff.createdAt,
    }
  }];
});

// PATCH /staff/:id - Update staff
mockState.on('patch', /\/staff\/([^/]+)$/, (config) => {
  const id = config.url!.match(/\/staff\/([^/]+)$/)![1];
  const data = JSON.parse(config.data);
  const updatedStaff = mockState.updateStaff(id, data);
  return [200, {
    status: 'success',
    message: 'Staff member updated successfully',
    data: {
      id: updatedStaff.id,
      name: updatedStaff.name,
      email: updatedStaff.email,
      phone: updatedStaff.phone,
      role: updatedStaff.role,
      is_active: updatedStaff.isActive,
      auth_provider: 'local',
      created_at: updatedStaff.createdAt,
      updated_at: updatedStaff.createdAt,
    }
  }];
});

// DELETE /staff/:id - Delete staff
mockState.on('delete', /\/staff\/([^/]+)$/, (config) => {
  const id = config.url!.match(/\/staff\/([^/]+)$/)![1];
  mockState.deleteStaff(id);
  return [200, {
    status: 'success',
    message: 'Staff member deleted successfully'
  }];
});
```

### Step 4: Update Mock State Methods

**File:** `frontend/lib/mock-state.ts`

**Verify/Add Methods:**
```typescript
class MockState {
  // Existing methods to verify
  getStaff(): Staff[]
  getStaffById(id: string): Staff | undefined
  createStaff(data: CreateStaffData): Staff
  updateStaff(id: string, data: UpdateStaffData): Staff
  toggleStaffStatus(id: string): Staff
  deleteStaff(id: string): void
}
```

### Step 5: Add Error Handling

**File:** `frontend/app/admin/staff/page.tsx`

**Enhanced Error Handling:**
```typescript
const fetchStaff = async () => {
  try {
    setLoading(true);
    setError('');
    const response = await apiClient.get('/staff');
    
    // Handle backend response structure
    if (response.data.status === 'success') {
      const staffData = response.data.data || [];
      setStaff(staffData.map(transformStaffResponse));
    } else {
      throw new Error('Invalid response format');
    }
  } catch (err: any) {
    console.error('Failed to fetch staff:', err);
    setError(err.response?.data?.message || err.message || 'Failed to load staff');
  } finally {
    setLoading(false);
  }
};

const handleCreateStaff = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    setSubmitting(true);
    const response = await apiClient.post('/staff', {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      role: formData.role,
    });
    
    if (response.data.status === 'success') {
      setToast({ 
        show: true, 
        message: response.data.message || 'Staff member created successfully', 
        type: 'success' 
      });
      setIsModalOpen(false);
      setFormData({ name: '', email: '', phone: '', password: '', role: 'kitchen' });
      fetchStaff();
    }
  } catch (err: any) {
    console.error('Failed to create staff:', err);
    setToast({ 
      show: true, 
      message: err.response?.data?.message || err.message || 'Failed to create staff', 
      type: 'error' 
    });
  } finally {
    setSubmitting(false);
  }
};

const handleToggleActive = async (staffId: string, currentStatus: boolean) => {
  try {
    const response = await apiClient.patch(`/staff/${staffId}/status`);
    
    if (response.data.status === 'success') {
      setToast({ 
        show: true, 
        message: response.data.message || `Staff ${!currentStatus ? 'activated' : 'deactivated'} successfully`, 
        type: 'success' 
      });
      fetchStaff();
    }
  } catch (err: any) {
    console.error('Failed to toggle staff status:', err);
    setToast({ 
      show: true, 
      message: err.response?.data?.message || err.message || 'Failed to update staff status', 
      type: 'error' 
    });
  }
};
```

## Implementation Checklist

### Frontend Page Updates
- [ ] Update Staff interface to match backend response
- [ ] Add StaffResponse interface for backend data
- [ ] Add transformStaffResponse function
- [ ] Change GET endpoint from `/auth/staff` to `/staff`
- [ ] Update response handling for nested structure
- [ ] Change POST endpoint from `/auth/register` to `/staff`
- [ ] Remove `isStaff` field from create request
- [ ] Change PATCH endpoint from `/auth/staff/:id/status` to `/staff/:id/status`
- [ ] Remove request body from toggle status call
- [ ] Add proper error handling for all API calls
- [ ] Update password minimum length from 6 to 8 characters

### Mock API Client Updates
- [ ] Change all `/auth/staff` endpoints to `/staff`
- [ ] Update GET /staff response structure (add status wrapper)
- [ ] Transform field names to snake_case in responses
- [ ] Update POST /staff response structure
- [ ] Fix PATCH /staff/:id/status to not expect body
- [ ] Add GET /staff/:id endpoint
- [ ] Add PATCH /staff/:id endpoint
- [ ] Add DELETE /staff/:id endpoint
- [ ] Ensure all responses match backend format

### Mock State Updates
- [ ] Verify getStaff() method exists
- [ ] Verify getStaffById() method exists
- [ ] Verify createStaff() method exists
- [ ] Verify updateStaff() method exists
- [ ] Verify toggleStaffStatus() method exists
- [ ] Verify deleteStaff() method exists

### Testing
- [ ] Test in mock mode (NEXT_PUBLIC_API_MODE=mock)
- [ ] Test staff list loading
- [ ] Test staff creation
- [ ] Test staff status toggle
- [ ] Test error handling
- [ ] Test in live mode with backend API
- [ ] Verify all field mappings work correctly

## Field Mapping Reference

| Frontend (Display) | Backend (API) | Type |
|-------------------|---------------|------|
| id | id | string |
| name | name | string |
| email | email | string |
| phone | phone | string \| null |
| role | role | string |
| isActive | is_active | boolean |
| createdAt | created_at | string |
| - | auth_provider | string |
| - | updated_at | string |

## API Response Format Reference

### Success Response
```typescript
{
  status: "success",
  message?: string,  // Optional, for create/update/delete
  data: T | T[]      // Single object or array
}
```

### Error Response
```typescript
{
  status: "error",
  message: string
}
```

## Implementation Order

1. ✅ Update frontend Staff interface and add transformation
2. ✅ Fix API endpoints in frontend page
3. ✅ Update request/response handling
4. ✅ Update mock API client endpoints
5. ✅ Update mock state methods (if needed)
6. ✅ Test in mock mode
7. ✅ Test in live mode with backend

## Success Criteria

- ✅ All API endpoints match backend exactly
- ✅ All field names match backend format
- ✅ Response structure handling is correct
- ✅ Request bodies match backend expectations
- ✅ Mock API behaves identically to real API
- ✅ Error handling works properly
- ✅ Both mock and live modes work correctly
- ✅ No TypeScript errors
- ✅ All CRUD operations work as expected

## Estimated Time

- Frontend page updates: 1-2 hours
- Mock API client updates: 1-2 hours
- Testing and debugging: 1-2 hours

**Total: 3-6 hours**
