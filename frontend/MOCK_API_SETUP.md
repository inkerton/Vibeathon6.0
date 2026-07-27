# Mock API Setup Guide

## Quick Start

### 1. Create Environment File

Create a `.env.local` file in the `frontend/` directory:

```bash
# API Mode Configuration
# Set to 'mock' for mock API or 'live' for real backend
NEXT_PUBLIC_API_MODE=mock

# Backend API URL (used when API_MODE=live)
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1

# Mock API Settings
NEXT_PUBLIC_MOCK_DELAY=300
NEXT_PUBLIC_MOCK_ERRORS=false
```

### 2. Run in Mock Mode

```bash
cd frontend
npm run dev:mock
```

The app will now run with mock data at http://localhost:3001

### 3. Switch to Live Mode

```bash
npm run dev:live
```

Or update `.env.local`:
```bash
NEXT_PUBLIC_API_MODE=live
```

## Available Scripts

```bash
npm run dev          # Default dev mode (uses .env.local)
npm run dev:mock     # Force mock API mode
npm run dev:live     # Force live backend mode
npm run build        # Build for production
npm run build:mock   # Build with mock API
npm run start        # Start production server
npm run start:mock   # Start with mock API
```

## Test Credentials

### Admin
- Email: `admin@restaurant.com`
- Password: `admin123`

### Customer
- Email: `customer@example.com`
- Password: `customer123`

### Kitchen Staff
- Email: `chef@restaurant.com`
- Password: `chef123`

### Inventory Staff
- Email: `inventory@restaurant.com`
- Password: `inventory123`

### Reception Staff
- Email: `reception@restaurant.com`
- Password: `reception123`

## Mock Data Overview

### Users (13 total)
- 2 Admins
- 3 Customers
- 3 Kitchen staff
- 2 Inventory staff
- 3 Reception staff

### Menu Items (22 total)
- 5 Starters
- 8 Main courses
- 4 Desserts
- 5 Beverages

### Orders (13 total)
- 2 Placed
- 3 Preparing
- 2 Ready
- 5 Completed
- 1 Cancelled

### Reservations (13 total)
- 3 Pending
- 4 Confirmed
- 2 Checked in
- 3 Completed
- 1 Cancelled

### Inventory Items (21 total)
- Normal stock: 15 items
- Low stock: 4 items
- Out of stock: 2 items

### Recipes
- Linked to 13 menu items
- Includes ingredient quantities
- Calculates max servings

### Transactions (22 total)
- Restock transactions
- Deduction transactions
- Adjustment transactions
- Reservation transactions
- Release transactions

## Features

### ✅ Fully Functional
- User authentication (all roles)
- Menu browsing and ordering
- Order management (kitchen workflow)
- Table reservations
- Inventory tracking
- Recipe management
- Staff management
- Real-time updates (simulated with delays)

### ✅ State Management
- In-memory state persistence during session
- Cart persists in localStorage
- Auth token persists in localStorage
- Order → Inventory updates automatic
- Reservation → Table status updates

### ✅ Realistic Behavior
- Network delays (300ms default)
- Proper error handling
- Data relationships maintained
- Transaction logging
- Stock calculations

## Limitations

1. **No Real Persistence**
   - Data resets on page refresh (except localStorage)
   - No database backing

2. **Simplified Logic**
   - Some complex validations simplified
   - No real-time updates (polling only)

3. **No Backend Validation**
   - Client-side validation only
   - May miss backend-specific errors

4. **State Management**
   - In-memory state only
   - Not shared across tabs/windows

## Troubleshooting

### Mock API not working?

1. Check `.env.local` exists with `NEXT_PUBLIC_API_MODE=mock`
2. Restart dev server after changing env variables
3. Clear browser cache and localStorage
4. Check browser console for errors

### Data not persisting?

This is expected behavior. Mock data resets on page refresh. Only cart and auth token persist in localStorage.

### Want to reset mock data?

Refresh the page. Mock state is reinitialized on each page load.

## Development Tips

1. **Test Edge Cases**
   - Low stock scenarios
   - Out of stock items
   - Concurrent orders
   - Reservation conflicts

2. **Use Different Roles**
   - Login as different users to test role-based features
   - Each role has specific permissions

3. **Monitor Console**
   - Mock API logs all requests
   - Check for "🎭 Running in MOCK API mode" message

4. **Customize Delays**
   - Set `NEXT_PUBLIC_MOCK_DELAY` to adjust network simulation
   - Set to 0 for instant responses

## Next Steps

Once frontend testing is complete:

1. Switch to live mode: `npm run dev:live`
2. Start backend: `cd ../backend && npm run dev`
3. Test integration with real API
4. Deploy both frontend and backend

---

**Created:** 2026-07-26  
**Last Updated:** 2026-07-26


**Frontend commands**

```
npx shadcn@latest init --preset b1uI7y2HA --template next

npx shadcn@latest add button card input label separator alert

npm install react-icons

npm install @mui/material @emotion/react @emotion/styled

npm install material-react-table @mui/material @mui/icons-material @emotion/react @emotion/styled
```
