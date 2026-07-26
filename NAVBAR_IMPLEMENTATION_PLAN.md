# Fixed Navbar Implementation Plan

## Overview
Create a fixed, responsive navbar component that displays user information (name, email), logout button, and role-based navigation links for all authenticated users across the application.

## Current State Analysis

### Existing Layouts
1. **Admin Layout** (`app/admin/layout.tsx`)
   - ✅ Has basic navbar with navigation
   - ✅ Shows user name
   - ✅ Has logout button
   - ⚠️ Not reusable, hardcoded for admin

2. **Kitchen Page** (`app/kitchen/page.tsx`)
   - ❌ No layout wrapper
   - ❌ No navbar
   - ❌ No user info display

3. **Reception Page** (`app/reception/page.tsx`)
   - ❌ No layout wrapper
   - ❌ No navbar
   - ❌ No user info display

4. **Customer Pages** (`app/customer/*`)
   - ❌ No layout wrapper
   - ❌ No navbar
   - ❌ No user info display

5. **Inventory Page** (`app/inventory/page.tsx`)
   - ❌ No layout wrapper
   - ❌ No navbar

### Auth Context Available Data
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'reception' | 'kitchen' | 'inventory' | 'admin';
}
```

## Design Requirements

### 1. Navbar Component Structure
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo/Brand]  [Nav Links...]        [User Info] [Logout]   │
└─────────────────────────────────────────────────────────────┘
```

### 2. Role-Based Navigation Links

#### Admin Role
- Dashboard (Overview)
- Staff Management
- Menu Management
- Inventory Management
- Recipe Management
- Analytics (future)

#### Kitchen Role
- Kitchen Dashboard (Active Orders)
- Order History (future)

#### Reception Role
- Reception Dashboard
- Reservations
- Waitlist (future)
- Payments

#### Inventory Role
- Inventory Dashboard
- Stock Management
- Suppliers (future)
- Reports (future)

#### Customer Role
- Browse Menu
- My Orders
- Order Tracking
- Reservations
- Profile

### 3. User Info Display
- **Desktop**: Show full name and email
- **Mobile**: Show initials in avatar, full info in dropdown

### 4. Logout Functionality
- Clear localStorage (accessToken, refreshToken, token)
- Disconnect socket
- Redirect to login page
- Show confirmation toast

## Implementation Steps

### Step 1: Create Navbar Component
**File**: `frontend/components/Navbar.tsx`

**Features**:
- Fixed position at top
- Responsive design (mobile hamburger menu)
- Role-based navigation items
- User profile dropdown
- Logout button
- Active link highlighting

**Props**:
```typescript
interface NavbarProps {
  user: User;
  onLogout: () => void;
}
```

### Step 2: Create Navigation Configuration
**File**: `frontend/lib/navigation-config.ts`

**Structure**:
```typescript
interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  roles: Role[];
}

const navigationItems: NavItem[] = [
  // Define all navigation items with role restrictions
];
```

### Step 3: Create Role-Specific Layouts

#### A. Kitchen Layout
**File**: `frontend/app/kitchen/layout.tsx`
- Wrap kitchen pages
- Include Navbar component
- Role guard (kitchen only)

#### B. Reception Layout
**File**: `frontend/app/reception/layout.tsx`
- Wrap reception pages
- Include Navbar component
- Role guard (reception only)

#### C. Inventory Layout
**File**: `frontend/app/inventory/layout.tsx`
- Wrap inventory pages
- Include Navbar component
- Role guard (inventory only)

#### D. Customer Layout
**File**: `frontend/app/customer/layout.tsx`
- Wrap customer pages
- Include Navbar component
- Role guard (customer only)

#### E. Update Admin Layout
**File**: `frontend/app/admin/layout.tsx`
- Replace existing navbar with new Navbar component
- Keep role guard

### Step 4: Create User Profile Dropdown
**File**: `frontend/components/UserProfileDropdown.tsx`

**Features**:
- Show user avatar (initials)
- Display full name and email
- Logout button
- Profile link (future)
- Settings link (future)

### Step 5: Mobile Responsive Menu
**File**: `frontend/components/MobileMenu.tsx`

**Features**:
- Hamburger icon toggle
- Slide-in menu
- Navigation links
- User info
- Logout button

### Step 6: Styling and Theming
- Use Tailwind CSS for consistency
- Match existing design system
- Add smooth transitions
- Ensure accessibility (ARIA labels)

## Component Hierarchy

```
RootLayout (app/layout.tsx)
├── AuthProvider
└── Role-Specific Layout
    ├── Navbar
    │   ├── Logo/Brand
    │   ├── NavigationLinks (desktop)
    │   ├── UserProfileDropdown
    │   └── MobileMenuToggle
    ├── MobileMenu (conditional)
    └── Page Content
```

## Technical Specifications

### Navbar Positioning
```css
position: fixed;
top: 0;
left: 0;
right: 0;
z-index: 50;
```

### Content Padding
Add top padding to page content to account for fixed navbar:
```css
padding-top: 4rem; /* 64px navbar height */
```

### Responsive Breakpoints
- Mobile: < 768px (hamburger menu)
- Tablet: 768px - 1024px (condensed nav)
- Desktop: > 1024px (full nav)

### Authentication Flow
1. User logs in → Token stored
2. AuthContext loads user data
3. Layout renders with Navbar
4. Navbar shows role-based links
5. User clicks logout → Clear auth → Redirect

## File Structure

```
frontend/
├── components/
│   ├── Navbar.tsx                    # Main navbar component
│   ├── UserProfileDropdown.tsx       # User info dropdown
│   ├── MobileMenu.tsx                # Mobile navigation
│   └── NavigationLink.tsx            # Individual nav link
├── lib/
│   └── navigation-config.ts          # Navigation items config
└── app/
    ├── admin/
    │   └── layout.tsx                # Updated with Navbar
    ├── kitchen/
    │   └── layout.tsx                # New layout with Navbar
    ├── reception/
    │   └── layout.tsx                # New layout with Navbar
    ├── inventory/
    │   └── layout.tsx                # New layout with Navbar
    └── customer/
        └── layout.tsx                # New layout with Navbar
```

## Testing Checklist

### Functionality Tests
- [ ] Navbar displays correctly for each role
- [ ] Navigation links work and highlight active page
- [ ] User info displays correctly (name, email)
- [ ] Logout button clears auth and redirects
- [ ] Mobile menu opens/closes properly
- [ ] Role guards prevent unauthorized access

### Visual Tests
- [ ] Navbar is fixed at top on scroll
- [ ] Responsive design works on all screen sizes
- [ ] Active link highlighting works
- [ ] Dropdown animations are smooth
- [ ] Mobile menu transitions are smooth

### Accessibility Tests
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] ARIA labels present
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG standards

## Implementation Priority

### Phase 1: Core Components (High Priority)
1. Create Navbar component
2. Create navigation configuration
3. Create UserProfileDropdown component
4. Update admin layout

### Phase 2: Role Layouts (High Priority)
1. Create kitchen layout
2. Create reception layout
3. Create inventory layout
4. Create customer layout

### Phase 3: Mobile Support (Medium Priority)
1. Create MobileMenu component
2. Add responsive breakpoints
3. Test on various devices

### Phase 4: Enhancements (Low Priority)
1. Add animations and transitions
2. Add profile page link
3. Add settings page link
4. Add notifications icon (future)

## Security Considerations

1. **Role Verification**: Always verify role on backend, not just frontend
2. **Token Management**: Securely handle token storage and removal
3. **Route Protection**: Ensure all routes have proper auth guards
4. **XSS Prevention**: Sanitize user input in navbar search (if added)

## Performance Considerations

1. **Lazy Loading**: Load mobile menu only when needed
2. **Memoization**: Use React.memo for navbar to prevent unnecessary re-renders
3. **Code Splitting**: Split navigation config by role if it grows large
4. **Image Optimization**: Optimize logo/brand images

## Future Enhancements

1. **Notifications**: Add notification bell with real-time updates
2. **Search**: Add global search functionality
3. **Theme Toggle**: Add dark/light mode toggle
4. **Language Selector**: Add multi-language support
5. **Quick Actions**: Add role-specific quick action buttons
6. **Breadcrumbs**: Add breadcrumb navigation for nested pages

## Success Criteria

✅ Fixed navbar visible on all authenticated pages
✅ User name and email displayed correctly
✅ Logout button works and clears authentication
✅ Role-based navigation links displayed correctly
✅ Mobile responsive design works
✅ Active link highlighting works
✅ No layout shifts or visual glitches
✅ Accessible via keyboard navigation
✅ Works across all supported browsers

## Next Steps

1. Review and approve this plan
2. Switch to `code` mode to implement
3. Start with Phase 1 (Core Components)
4. Test each component before moving to next phase
5. Deploy and gather user feedback
