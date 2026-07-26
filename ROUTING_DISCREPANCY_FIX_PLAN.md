# Routing Discrepancy Fix Plan

## Problem Analysis

After login, users are redirected based on their role, but the routing logic is inconsistent with the actual file structure.

### Current Routing Logic (app/page.tsx)

```typescript
switch (user.role) {
  case 'customer':
    router.push('/customer/menu');        // ✅ EXISTS
    break;
  case 'reception':
    router.push('/reception/dashboard');  // ❌ DOESN'T EXIST
    break;
  case 'kitchen':
    router.push('/kitchen/orders');       // ❌ DOESN'T EXIST
    break;
  case 'inventory':
    router.push('/inventory/dashboard');  // ❌ DOESN'T EXIST
    break;
  case 'admin':
    router.push('/admin/dashboard');      // ❌ DOESN'T EXIST
    break;
}
```

### Actual File Structure

```
app/
├── admin/
│   ├── page.tsx              ← Admin dashboard IS HERE (not /admin/dashboard)
│   ├── inventory/
│   ├── menu/
│   ├── recipes/
│   └── staff/
├── reception/
│   ├── page.tsx              ← Reception main page IS HERE (not /reception/dashboard)
│   └── reservations/
├── kitchen/
│   └── page.tsx              ← Kitchen main page IS HERE (not /kitchen/orders)
├── inventory/
│   └── page.tsx              ← Inventory main page IS HERE (not /inventory/dashboard)
└── customer/
    ├── menu/
    ├── orders/
    ├── checkout/
    └── reservations/
```

### The Discrepancy

| Role | Redirect Target | Actual File | Status |
|------|----------------|-------------|--------|
| customer | `/customer/menu` | `/customer/menu/page.tsx` | ✅ Exists |
| reception | `/reception/dashboard` | `/reception/page.tsx` | ❌ Wrong path |
| kitchen | `/kitchen/orders` | `/kitchen/page.tsx` | ❌ Wrong path |
| inventory | `/inventory/dashboard` | `/inventory/page.tsx` | ❌ Wrong path |
| admin | `/admin/dashboard` | `/admin/page.tsx` | ❌ Wrong path |

## Root Cause

The routing logic assumes a `/dashboard` or specific subdirectory exists for each role, but:
- Admin has a dashboard at `/admin/page.tsx` (not `/admin/dashboard/page.tsx`)
- Reception has main page at `/reception/page.tsx` (not `/reception/dashboard/page.tsx`)
- Kitchen has main page at `/kitchen/page.tsx` (not `/kitchen/orders/page.tsx`)
- Inventory has main page at `/inventory/page.tsx` (not `/inventory/dashboard/page.tsx`)

## Solution Options

### Option 1: Fix Routing Logic (Recommended) ⭐

**Change the redirect paths to match existing file structure.**

**Pros:**
- Quick fix (1 file change)
- No file restructuring needed
- Maintains existing functionality
- No risk of breaking existing pages

**Cons:**
- None

**Implementation:**
Update `app/page.tsx` to redirect to correct paths:

```typescript
switch (user.role) {
  case 'customer':
    router.push('/customer/menu');
    break;
  case 'reception':
    router.push('/reception');        // Changed
    break;
  case 'kitchen':
    router.push('/kitchen');          // Changed
    break;
  case 'inventory':
    router.push('/inventory');        // Changed
    break;
  case 'admin':
    router.push('/admin');            // Changed
    break;
}
```

### Option 2: Rename Files to Match Routing

**Rename existing pages to match the routing logic.**

**Pros:**
- Routing logic stays as-is
- More explicit naming (dashboard, orders)

**Cons:**
- Requires moving/renaming multiple files
- Need to update imports and references
- Risk of breaking existing functionality
- More work for same result

**Implementation:**
- Move `/admin/page.tsx` → `/admin/dashboard/page.tsx`
- Move `/reception/page.tsx` → `/reception/dashboard/page.tsx`
- Move `/kitchen/page.tsx` → `/kitchen/orders/page.tsx`
- Move `/inventory/page.tsx` → `/inventory/dashboard/page.tsx`

### Option 3: Create Redirect Pages

**Keep both structures and create redirect pages.**

**Pros:**
- Backward compatible
- Both paths work

**Cons:**
- Unnecessary complexity
- Extra files to maintain
- Confusing structure

## Recommended Solution: Option 1

**Fix the routing logic in `app/page.tsx`** to match the existing file structure.

### Implementation Steps

1. ✅ Update `app/page.tsx` redirect logic
2. ✅ Verify each role's landing page exists
3. ✅ Test routing for all roles
4. ✅ Update any hardcoded links in the app

### Files to Modify

#### 1. app/page.tsx

**Current:**
```typescript
case 'reception':
  router.push('/reception/dashboard');
  break;
case 'kitchen':
  router.push('/kitchen/orders');
  break;
case 'inventory':
  router.push('/inventory/dashboard');
  break;
case 'admin':
  router.push('/admin/dashboard');
  break;
```

**Fixed:**
```typescript
case 'reception':
  router.push('/reception');
  break;
case 'kitchen':
  router.push('/kitchen');
  break;
case 'inventory':
  router.push('/inventory');
  break;
case 'admin':
  router.push('/admin');
  break;
```

### Verification Checklist

After fixing, verify each role redirects correctly:

- [ ] Customer → `/customer/menu` (already correct)
- [ ] Reception → `/reception` (fixed)
- [ ] Kitchen → `/kitchen` (fixed)
- [ ] Inventory → `/inventory` (fixed)
- [ ] Admin → `/admin` (fixed)

### Additional Checks

Search for any hardcoded references to the wrong paths:

```bash
# Search for hardcoded dashboard paths
grep -r "reception/dashboard" frontend/
grep -r "kitchen/orders" frontend/
grep -r "inventory/dashboard" frontend/
grep -r "admin/dashboard" frontend/
```

**Expected locations to check:**
- Navigation components
- Layout files
- Link components
- Redirect logic

### Page Content Verification

Ensure each landing page has appropriate content:

| Role | Path | Content Type | Status |
|------|------|--------------|--------|
| Admin | `/admin` | Full dashboard with stats | ✅ Complete |
| Reception | `/reception` | Reception management | ❓ Need to verify |
| Kitchen | `/kitchen` | Kitchen orders view | ❓ Need to verify |
| Inventory | `/inventory` | Inventory management | ❓ Need to verify |
| Customer | `/customer/menu` | Menu browsing | ✅ Complete |

### Testing Plan

1. **Test Each Role Login:**
   - Login as customer → Should land on `/customer/menu`
   - Login as reception → Should land on `/reception`
   - Login as kitchen → Should land on `/kitchen`
   - Login as inventory → Should land on `/inventory`
   - Login as admin → Should land on `/admin`

2. **Test Navigation:**
   - Verify all navigation links work
   - Check breadcrumbs are correct
   - Ensure no 404 errors

3. **Test Direct Access:**
   - Try accessing each path directly
   - Verify authentication redirects work
   - Check role-based access control

## Implementation Order

1. ✅ Fix routing logic in `app/page.tsx`
2. ✅ Search for hardcoded references to wrong paths
3. ✅ Update any found references
4. ✅ Verify each role's landing page content
5. ✅ Test login flow for all roles
6. ✅ Test navigation between pages

## Success Criteria

- ✅ All roles redirect to correct existing pages after login
- ✅ No 404 errors on login
- ✅ All navigation links work correctly
- ✅ No hardcoded references to non-existent paths
- ✅ Each role sees appropriate content on their landing page

## Estimated Time

- Fix routing logic: 5 minutes
- Search and update references: 15 minutes
- Testing: 15 minutes

**Total: 35 minutes**

## Additional Improvements (Optional)

After fixing the routing, consider:

1. **Add Role-Specific Dashboards:**
   - Create proper dashboard pages for reception, kitchen, inventory
   - Add relevant metrics and quick actions
   - Follow the admin dashboard pattern

2. **Improve Navigation:**
   - Add breadcrumbs
   - Highlight active page in navigation
   - Add role-specific menu items

3. **Add Redirects:**
   - Redirect `/role/dashboard` → `/role` for backward compatibility
   - Add proper 404 pages for each role section

## Status

**Current:** Planning complete
**Next:** Implement routing fix in `app/page.tsx`
