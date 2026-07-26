# Staff Management API Implementation Plan

## Overview

Implement a complete staff management system in the backend to allow admins to manage staff members (users with roles: reception, kitchen, inventory, admin).

## Current State

- ✅ User model exists with Role enum
- ✅ Auth system with registration/login
- ✅ Frontend mock has staff data and endpoints
- ❌ No staff-specific routes
- ❌ No staff CRUD operations
- ❌ No admin-only middleware

## Implementation Steps

### Step 1: Create Staff Service

**File:** `backend/src/services/staff.service.ts`

**Purpose:** Business logic for staff management

**Methods to Implement:**

```typescript
class StaffService {
  // Get all staff members (exclude customers)
  async getAllStaff(filters?: StaffFilters): Promise<User[]>
  
  // Get staff by ID
  async getStaffById(id: string): Promise<User>
  
  // Create new staff member
  async createStaff(data: CreateStaffDTO): Promise<User>
  
  // Update staff member
  async updateStaff(id: string, data: UpdateStaffDTO): Promise<User>
  
  // Toggle staff active status
  async toggleStaffStatus(id: string): Promise<User>
  
  // Delete staff member (soft delete - set is_active to false)
  async deleteStaff(id: string): Promise<void>
  
  // Get staff by role
  async getStaffByRole(role: Role): Promise<User[]>
  
  // Check if email exists (for validation)
  async isEmailTaken(email: string, excludeId?: string): Promise<boolean>
}
```

**Key Features:**
- Filter staff by role, active status
- Exclude customers from staff listings
- Validate email uniqueness
- Hash passwords for new staff
- Prevent deletion of last admin

### Step 2: Create Staff Controller

**File:** `backend/src/controllers/staff.controller.ts`

**Purpose:** Handle HTTP requests and responses

**Endpoints to Implement:**

```typescript
class StaffController {
  // GET /staff - List all staff
  async getAllStaff(req: Request, res: Response)
  
  // GET /staff/:id - Get staff by ID
  async getStaffById(req: Request, res: Response)
  
  // POST /staff - Create new staff
  async createStaff(req: Request, res: Response)
  
  // PATCH /staff/:id - Update staff
  async updateStaff(req: Request, res: Response)
  
  // PATCH /staff/:id/status - Toggle active status
  async toggleStaffStatus(req: Request, res: Response)
  
  // DELETE /staff/:id - Delete staff
  async deleteStaff(req: Request, res: Response)
}
```

**Request/Response Examples:**

**GET /staff**
```json
Response: {
  "data": [
    {
      "id": "staff-1",
      "name": "Chef Mario",
      "email": "chef@restaurant.com",
      "role": "kitchen",
      "is_active": true,
      "created_at": "2024-01-05T00:00:00Z"
    }
  ]
}
```

**POST /staff**
```json
Request: {
  "name": "New Chef",
  "email": "newchef@restaurant.com",
  "password": "securepass123",
  "role": "kitchen"
}

Response: {
  "data": {
    "id": "staff-new",
    "name": "New Chef",
    "email": "newchef@restaurant.com",
    "role": "kitchen",
    "is_active": true,
    "created_at": "2024-03-15T10:30:00Z"
  }
}
```

**PATCH /staff/:id**
```json
Request: {
  "name": "Updated Name",
  "role": "inventory"
}

Response: {
  "data": {
    "id": "staff-1",
    "name": "Updated Name",
    "email": "chef@restaurant.com",
    "role": "inventory",
    "is_active": true,
    "updated_at": "2024-03-15T10:35:00Z"
  }
}
```

### Step 3: Create Staff Routes

**File:** `backend/src/routes/staff.routes.ts`

**Purpose:** Define API endpoints and apply middleware

**Route Structure:**

```typescript
import { Router } from 'express';
import { StaffController } from '../controllers/staff.controller';
import { authMiddleware, adminOnly } from '../middleware/auth.middleware';

const router = Router();
const staffController = new StaffController();

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(adminOnly);

// Staff CRUD operations
router.get('/', staffController.getAllStaff.bind(staffController));
router.get('/:id', staffController.getStaffById.bind(staffController));
router.post('/', staffController.createStaff.bind(staffController));
router.patch('/:id', staffController.updateStaff.bind(staffController));
router.patch('/:id/status', staffController.toggleStaffStatus.bind(staffController));
router.delete('/:id', staffController.deleteStaff.bind(staffController));

export default router;
```

### Step 4: Update Auth Middleware

**File:** `backend/src/middleware/auth.middleware.ts`

**Add Admin-Only Middleware:**

```typescript
// Existing authMiddleware stays the same

// New middleware for admin-only routes
export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Access denied. Admin privileges required.' 
    });
  }
  
  next();
};

// Optional: Role-based middleware factory
export const requireRole = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }
    
    next();
  };
};
```

### Step 5: Register Staff Routes

**File:** `backend/src/index.ts`

**Add Staff Routes to Main App:**

```typescript
import staffRoutes from './routes/staff.routes';

// ... existing imports and setup ...

// Register routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/menu', menuRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/reservations', reservationRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/recipes', recipeRoutes);
app.use('/api/v1/staff', staffRoutes); // NEW
```

### Step 6: Add Validation

**Create DTOs for Request Validation:**

```typescript
// backend/src/types/staff.types.ts

export interface CreateStaffDTO {
  name: string;
  email: string;
  password: string;
  role: 'reception' | 'kitchen' | 'inventory' | 'admin';
  phone?: string;
}

export interface UpdateStaffDTO {
  name?: string;
  email?: string;
  role?: 'reception' | 'kitchen' | 'inventory' | 'admin';
  phone?: string;
}

export interface StaffFilters {
  role?: Role;
  is_active?: boolean;
  search?: string; // Search by name or email
}
```

**Validation Rules:**

- **name**: Required, 2-100 characters
- **email**: Required, valid email format, unique
- **password**: Required for creation, min 8 characters
- **role**: Required, must be one of: reception, kitchen, inventory, admin
- **phone**: Optional, valid phone format

### Step 7: Add Error Handling

**Common Error Scenarios:**

```typescript
// Staff not found
throw new Error('Staff member not found');

// Email already exists
throw new Error('Email already in use');

// Cannot delete last admin
throw new Error('Cannot delete the last admin user');

// Invalid role
throw new Error('Invalid role. Must be: reception, kitchen, inventory, or admin');

// Cannot modify own account
throw new Error('Cannot modify your own account through staff management');
```

### Step 8: Update Seed Data

**File:** `backend/prisma/seed.ts`

**Add Staff Members to Seed:**

```typescript
// Create staff users
const staff = await Promise.all([
  prisma.user.create({
    data: {
      name: 'Chef Mario',
      email: 'chef@restaurant.com',
      password_hash: await bcrypt.hash('chef123', 10),
      role: 'kitchen',
      auth_provider: 'local',
      is_active: true
    }
  }),
  prisma.user.create({
    data: {
      name: 'Front Desk Lisa',
      email: 'reception@restaurant.com',
      password_hash: await bcrypt.hash('reception123', 10),
      role: 'reception',
      auth_provider: 'local',
      is_active: true
    }
  }),
  prisma.user.create({
    data: {
      name: 'Stock Manager Sarah',
      email: 'inventory@restaurant.com',
      password_hash: await bcrypt.hash('inventory123', 10),
      role: 'inventory',
      auth_provider: 'local',
      is_active: true
    }
  })
]);
```

## API Endpoints Summary

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/v1/staff` | List all staff | ✅ | Admin |
| GET | `/api/v1/staff/:id` | Get staff by ID | ✅ | Admin |
| POST | `/api/v1/staff` | Create new staff | ✅ | Admin |
| PATCH | `/api/v1/staff/:id` | Update staff | ✅ | Admin |
| PATCH | `/api/v1/staff/:id/status` | Toggle active status | ✅ | Admin |
| DELETE | `/api/v1/staff/:id` | Delete staff | ✅ | Admin |

## Testing Checklist

### Unit Tests
- [ ] StaffService.getAllStaff()
- [ ] StaffService.getStaffById()
- [ ] StaffService.createStaff()
- [ ] StaffService.updateStaff()
- [ ] StaffService.toggleStaffStatus()
- [ ] StaffService.deleteStaff()

### Integration Tests
- [ ] GET /staff returns all staff (excludes customers)
- [ ] GET /staff/:id returns specific staff
- [ ] POST /staff creates new staff with hashed password
- [ ] POST /staff rejects duplicate email
- [ ] PATCH /staff/:id updates staff details
- [ ] PATCH /staff/:id/status toggles active status
- [ ] DELETE /staff/:id soft deletes staff
- [ ] DELETE /staff/:id prevents deleting last admin
- [ ] All endpoints require authentication
- [ ] All endpoints require admin role
- [ ] Non-admin users get 403 Forbidden

### Manual Testing
- [ ] Create staff via Postman/Thunder Client
- [ ] Update staff details
- [ ] Toggle staff active/inactive
- [ ] Delete staff member
- [ ] Verify deleted staff cannot login
- [ ] Verify frontend staff page works with real API

## Security Considerations

1. **Password Handling**
   - Always hash passwords with bcrypt
   - Never return password_hash in responses
   - Require strong passwords (min 8 chars)

2. **Authorization**
   - Only admins can access staff endpoints
   - Prevent admins from deleting themselves
   - Prevent deletion of last admin

3. **Input Validation**
   - Validate all input data
   - Sanitize email addresses
   - Check for SQL injection attempts

4. **Rate Limiting**
   - Add rate limiting to prevent abuse
   - Limit staff creation to prevent spam

## Database Considerations

**No Schema Changes Required** ✅

The existing User model supports all staff management needs:
- `role` field for staff types
- `is_active` for soft delete
- `auth_provider` set to 'local'
- All necessary fields present

## Frontend Integration

Once backend is complete, update frontend to use real API:

```typescript
// frontend/lib/api-client.ts
// Remove mock mode or set NEXT_PUBLIC_API_MODE=live

// Staff API calls will work automatically
const response = await apiClient.get('/staff');
const staff = response.data;
```

## Implementation Order

1. ✅ Create staff.service.ts (business logic)
2. ✅ Create staff.controller.ts (HTTP handlers)
3. ✅ Create staff.routes.ts (route definitions)
4. ✅ Update auth.middleware.ts (add adminOnly)
5. ✅ Register routes in index.ts
6. ✅ Add validation types
7. ✅ Update seed.ts with staff data
8. ✅ Test all endpoints
9. ✅ Update frontend to use real API

## Estimated Time

- Service Layer: 2-3 hours
- Controller Layer: 1-2 hours
- Routes & Middleware: 1 hour
- Testing: 2-3 hours
- Documentation: 1 hour

**Total: 7-10 hours**

## Success Criteria

- ✅ All 6 staff endpoints working
- ✅ Admin-only access enforced
- ✅ Password hashing implemented
- ✅ Email uniqueness validated
- ✅ Cannot delete last admin
- ✅ Soft delete (is_active flag)
- ✅ All tests passing
- ✅ Frontend integration working

## Next Steps

After implementation:
1. Add audit logging for staff changes
2. Add email notifications for new staff
3. Add password reset for staff
4. Add staff activity tracking
5. Add staff performance metrics
