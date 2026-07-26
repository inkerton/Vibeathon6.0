# TypeScript Errors Fix Guide

## Current Status
- **Errors:** ~37 TypeScript errors
- **Location:** Route files (`src/routes/*.ts`)
- **Type:** Express RequestHandler type compatibility issues
- **Impact:** Cosmetic only - code runs perfectly

## Problem Analysis

The errors occur because:
1. Express `router.get/post/patch/delete` expects standard `RequestHandler` type
2. Our `authHandler` wrapper returns a function that TypeScript can't properly type-check
3. The `AuthRequest` type (extends `Request` with `user` property) conflicts with Express types

## Solution Options

### Option 1: Type Assertion in Routes (RECOMMENDED - Simplest)

Remove the `authHandler` wrapper and use direct type assertions:

**Before:**
```typescript
router.get('/', authHandler((req, res, next) => controller.method(req, res, next)));
```

**After:**
```typescript
router.get('/', (req, res, next) => controller.method(req as AuthRequest, res, next));
```

**Implementation:**
1. Remove `authHandler` import from all route files
2. Replace all `authHandler(...)` calls with direct arrow functions
3. Cast `req as AuthRequest` where needed

**Files to update:**
- `src/routes/auth.routes.ts`
- `src/routes/inventory.routes.ts`
- `src/routes/menu.routes.ts`
- `src/routes/order.routes.ts`
- `src/routes/recipe.routes.ts`
- `src/routes/reservation.routes.ts`

### Option 2: Disable Strict Type Checking (NOT RECOMMENDED)

Add to `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": false,
    "skipLibCheck": true
  }
}
```

**Pros:** Quick fix
**Cons:** Loses type safety benefits

### Option 3: Custom Route Type Definitions (COMPLEX)

Create custom type definitions that properly extend Express types.

**Pros:** Maintains full type safety
**Cons:** Complex, time-consuming, may conflict with Express updates

## Recommended Fix - Step by Step

### Step 1: Update auth.routes.ts

```typescript
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import passport from '../config/passport';

const router = Router();
const authController = new AuthController();

// Public routes - no auth needed, but controllers expect AuthRequest
router.post('/register', (req, res, next) => 
  authController.register(req as AuthRequest, res, next)
);

router.post('/verify-otp', (req, res, next) => 
  authController.verifyOTP(req as AuthRequest, res, next)
);

router.post('/login', (req, res, next) => 
  authController.login(req as AuthRequest, res, next)
);

router.post('/resend-otp', (req, res, next) => 
  authController.resendOTP(req as AuthRequest, res, next)
);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  session: false 
}));

router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/auth/login?error=oauth_failed`
  }),
  (req, res, next) => authController.googleAuthCallback(req as AuthRequest, res, next)
);

// Protected routes
router.get('/me', authMiddleware, (req, res, next) => 
  authController.getCurrentUser(req as AuthRequest, res, next)
);

router.post('/logout', authMiddleware, (req, res, next) => 
  authController.logout(req as AuthRequest, res, next)
);

export default router;
```

### Step 2: Update inventory.routes.ts

```typescript
import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();
const inventoryController = new InventoryController();

// All inventory routes require authentication
router.use(authMiddleware);

// Get all inventory items
router.get('/',
  roleMiddleware([Role.inventory, Role.admin]),
  (req, res, next) => inventoryController.getAllInventoryItems(req as AuthRequest, res, next)
);

// Get low stock items
router.get('/low-stock',
  roleMiddleware([Role.inventory, Role.admin]),
  (req, res, next) => inventoryController.getLowStockItems(req as AuthRequest, res, next)
);

// ... repeat for all other routes
```

### Step 3: Apply Same Pattern to All Route Files

Apply the same pattern to:
- `menu.routes.ts`
- `order.routes.ts`
- `recipe.routes.ts`
- `reservation.routes.ts`

### Step 4: Remove authHandler from route-helpers.ts

Keep only the utility functions:

```typescript
import { Request } from 'express';

export function getRouteParam(req: Request, paramName: string): string {
  const param = req.params[paramName];
  if (Array.isArray(param)) {
    return param[0];
  }
  return param;
}

export function getQueryParam(req: Request, paramName: string): string | undefined {
  const param = req.query[paramName];
  if (Array.isArray(param)) {
    return param[0] as string;
  }
  return param as string | undefined;
}
```

### Step 5: Verify Build

```bash
cd backend
npm run build
# Should complete with 0 errors
```

## Why This Works

1. **Direct Type Casting:** `req as AuthRequest` tells TypeScript to trust us
2. **No Wrapper Function:** Removes the type inference complexity
3. **Standard Express Pattern:** Uses Express's expected function signature
4. **Runtime Safety:** The `authMiddleware` ensures `req.user` exists before protected routes

## Alternative: If You Want to Keep authHandler

If you prefer keeping the wrapper, update it to:

```typescript
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';

export function authHandler(
  handler: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void> | void
): RequestHandler {
  return ((req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req as AuthRequest, res, next)).catch(next);
  }) as RequestHandler;
}
```

But this still may have type issues depending on Express version.

## Testing After Fix

```bash
# 1. Build should succeed
npm run build

# 2. Server should start
npm run dev

# 3. Test endpoints
curl http://localhost:5000/health
curl http://localhost:5000/api/v1/menu
```

## Notes

- The type errors are **cosmetic only** - the code runs perfectly
- Runtime behavior is unchanged
- The `authMiddleware` provides actual security, not TypeScript types
- This is a common pattern in Express + TypeScript projects
- Consider this a TypeScript limitation, not a code quality issue

## Time Estimate

- **Manual fix:** 15-20 minutes (update 6 route files)
- **Automated script:** Could create a sed script to do it in 2 minutes
- **Testing:** 5 minutes

## Success Criteria

✅ `npm run build` completes with 0 errors  
✅ Server starts without issues  
✅ All API endpoints work correctly  
✅ No runtime errors
