# Staff Creation API Debug Plan

## Problem
Getting 400 Bad Request error when creating staff from admin panel:
```
Failed to create staff: AxiosError: Request failed with status code 400 (app/admin/staff/page.tsx:121:15)
```

## Analysis

### Frontend Request (app/admin/staff/page.tsx)
**Location**: Line 108-114
```typescript
const response = await apiClient.post('/staff', {
  name: formData.name,
  email: formData.email,
  phone: formData.phone,
  password: formData.password,
  role: formData.role,
});
```

**Request Body Structure**:
- name: string (required in form)
- email: string (required in form)
- phone: string (required in form)
- password: string (required in form, minLength=8)
- role: 'kitchen' | 'reception' | 'inventory' | 'admin' (required in form)

### Backend Validation (controllers/staff.controller.ts)
**Location**: Line 17-24
```typescript
const createStaffSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['reception', 'kitchen', 'inventory', 'admin']),
  phone: z.string().optional(),
});
```

### Backend Service (services/staff.service.ts)
**CreateStaffDTO Interface**:
```typescript
export interface CreateStaffDTO {
  name: string;
  email: string;
  password: string;
  role: 'reception' | 'kitchen' | 'inventory' | 'admin';
  phone?: string;
}
```

## Identified Issues

### Issue 1: Phone Field Mismatch ⚠️
- **Frontend**: Requires phone (required field in form)
- **Backend**: Phone is optional in validation schema
- **Problem**: Frontend sends empty string `""` when phone is not filled, but backend might not handle empty strings properly

### Issue 2: Potential Authentication Issue
- **Route Protection**: All `/staff` routes require `authMiddleware` and `adminOnly`
- **Token Storage**: Frontend uses both `localStorage.getItem('token')` and `localStorage.getItem('accessToken')`
- **Problem**: Need to verify correct token is being sent

### Issue 3: API Base URL
- **Frontend**: Uses `http://localhost:5000/api/v1` as base URL
- **Actual Request**: POST to `/staff` → `http://localhost:5000/api/v1/staff`
- **Need to verify**: Backend is running and route is registered correctly

## Root Cause Analysis

The most likely issue is **Issue 1**: The phone field handling.

When the frontend form requires phone but the user doesn't fill it (or it's empty), it sends:
```json
{
  "phone": ""
}
```

The backend Zod schema has `phone: z.string().optional()`, which means:
- `undefined` → Valid (field not present)
- `null` → Invalid (not a string)
- `""` → Valid (empty string is still a string)

However, the Prisma schema might have constraints on the phone field that reject empty strings.

## Recommended Fixes

### Fix 1: Update Backend Validation (Recommended)
Make phone field nullable and handle empty strings:

```typescript
const createStaffSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['reception', 'kitchen', 'inventory', 'admin']),
  phone: z.string().optional().nullable().transform(val => val || null),
});
```

### Fix 2: Update Frontend Form
Make phone optional in the frontend:

```typescript
<input
  type="tel"
  className="form-input"
  value={formData.phone}
  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
  // Remove required attribute
/>
```

### Fix 3: Add Better Error Logging
Add console.log in the catch block to see the actual error message:

```typescript
catch (err: any) {
  console.error('Failed to create staff:', err);
  console.error('Error response:', err.response?.data); // Add this
  setToast({ 
    show: true, 
    message: err.response?.data?.message || err.message || 'Failed to create staff', 
    type: 'error' 
  });
}
```

## Testing Steps

1. **Check Backend Logs**: Look for validation error details
2. **Test with Browser DevTools**: 
   - Open Network tab
   - Attempt to create staff
   - Check request payload and response
3. **Test Phone Field Variations**:
   - Empty string
   - Valid phone number
   - Null value
4. **Verify Authentication**:
   - Check if token is present in request headers
   - Verify token is valid and user has admin role

## Implementation Priority

1. ✅ **High Priority**: Add error logging to see actual error message
2. ✅ **High Priority**: Fix phone field validation in backend
3. ✅ **Medium Priority**: Make phone optional in frontend form
4. ✅ **Low Priority**: Add field-level validation feedback

## Next Steps

1. Switch to `code` mode to implement fixes
2. Start with adding error logging
3. Fix backend validation schema
4. Test staff creation
5. Update frontend form if needed
