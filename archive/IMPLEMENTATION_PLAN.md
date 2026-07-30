# Vibeathon 6.0 - Smart Restaurant Management System
## Implementation Plan

**Project:** Smart Restaurant Management SaaS Platform  
**Duration:** 3 Days (July 25-27, 2026)  
**Tech Stack:** Next.js 14 + Express + Prisma + Supabase + Socket.io  
**Current Status:** Initial setup phase

---

## Project Overview

A full-stack restaurant operations platform that digitizes:
- Customer experience (reservations, ordering, tracking, reviews)
- Reception operations (table management, waitlist, billing)
- Kitchen workflow (order queue, status updates, availability)
- Inventory management (stock tracking, auto-reserve/deduct, forecasting)
- Admin dashboard (analytics, staff management, AI insights)

**Key Differentiator:** Real-time inventory integration that prevents overselling by tying menu availability to actual stock levels.

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js 14 Frontend (Vercel)                               │
│  /customer /reception /kitchen /inventory /admin            │
│  - React 19 + Tailwind CSS + Socket.io-client              │
└────────────────────┬────────────────────────────────────────┘
                     │ REST + WebSocket
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Express.js Backend (Render)                                │
│  - JWT Auth + RBAC Middleware                               │
│  - REST API Endpoints                                       │
│  - Socket.io Server (real-time sync)                        │
│  - Inventory Service (transactional reserve/deduct)         │
│  - AI Service (Gemini integration)                          │
└────────────────────┬────────────────────────────────────────┘
                     │ Prisma ORM
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase PostgreSQL Database                               │
│  - 12 core models (User, Order, MenuItem, Inventory, etc.)  │
│  - Transactional inventory operations                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Day 1: Foundation (Bronze + Silver Tier)

### Phase 1.1: Project Setup & Infrastructure (2-3 hours)

**Backend Setup:**
1. Create folder structure per CODING_STANDARDS.md:
   ```
   backend/src/
   ├── routes/
   ├── controllers/
   ├── services/
   ├── middleware/
   ├── sockets/
   ├── utils/
   ├── config/
   └── index.ts
   ```

2. Initialize Prisma:
   - Install Prisma CLI and client
   - Create `prisma/schema.prisma` with complete schema from DATABASE.md
   - Set up Supabase connection string
   - Run initial migration

3. Configure Express server:
   - Set up CORS, body-parser, helmet
   - Create error handling middleware
   - Set up Socket.io server
   - Configure environment variables

4. Deploy skeleton backend to Render (verify deployment works early)

**Frontend Setup:**
1. Create role-based route structure:
   ```
   frontend/app/
   ├── customer/
   ├── reception/
   ├── kitchen/
   ├── inventory/
   ├── admin/
   ├── auth/
   └── api/ (Next.js API routes if needed)
   ```

2. Set up shared infrastructure:
   - `/lib/api-client.ts` - Axios instance with auth interceptor
   - `/lib/socket-client.ts` - Socket.io client singleton
   - `/lib/auth-context.tsx` - Auth state management
   - `/components/` - Shared UI components

3. Configure Tailwind design tokens per UI_GUIDELINES.md

4. Deploy skeleton frontend to Vercel

**Environment Configuration:**
- Create `.env.example` files for both frontend and backend
- Document all required environment variables

### Phase 1.2: Authentication System (3-4 hours)

**Backend:**
1. User model and Prisma schema (already in DATABASE.md)
2. Auth routes (`/api/v1/auth/*`):
   - POST `/register` - Email/password signup
   - POST `/verify-otp` - OTP verification
   - POST `/login` - Email/password login
   - GET `/google` - Google OAuth initiation
   - GET `/google/callback` - OAuth callback
   - POST `/logout` - Token invalidation
   - GET `/me` - Current user profile

3. Implement JWT middleware:
   - Token generation (access + refresh)
   - Token verification middleware
   - RBAC middleware (role-based access control)

4. OTP service:
   - Generate 6-digit OTP
   - Store with expiry (5 minutes)
   - Send via email (Nodemailer) or SMS (Twilio)

5. Google OAuth integration:
   - Configure passport-google-oauth20
   - Handle OAuth callback
   - Create/link user accounts

**Frontend:**
1. Auth pages:
   - `/auth/login` - Login form
   - `/auth/register` - Registration form
   - `/auth/verify-otp` - OTP verification
   - `/auth/google` - OAuth redirect handler

2. Auth context provider:
   - Store JWT in httpOnly cookie or localStorage
   - Provide login/logout/register functions
   - Auto-refresh token logic
   - Role-based route guards

3. Protected route wrapper component

### Phase 1.3: Core Customer Features (4-5 hours)

**Menu System:**
1. Backend:
   - MenuItem model (already in schema)
   - GET `/menu` - List all menu items with live availability
   - GET `/menu/:id` - Item details
   - POST `/menu` - Create item (admin only)
   - PATCH `/menu/:id` - Update item (admin only)

2. Frontend:
   - `/customer/menu` - Browse menu with categories
   - Menu item card component (image, name, price, availability badge)
   - Category filter/tabs
   - Search functionality

**Reservation System:**
1. Backend:
   - Reservation model (already in schema)
   - POST `/reservations` - Create reservation
   - GET `/reservations` - Customer's reservations
   - GET `/reservations/all` - All reservations (reception/admin)
   - PATCH `/reservations/:id` - Update status
   - DELETE `/reservations/:id` - Cancel

2. Frontend:
   - `/customer/book` - Reservation form (date, time, party size, special requests)
   - `/customer/reservations` - Reservation history
   - Date/time picker component
   - Confirmation modal

**Order System (Basic):**
1. Backend:
   - Order and OrderItem models
   - POST `/orders` - Create order
   - GET `/orders/:id` - Order details
   - GET `/orders/history` - Customer order history

2. Frontend:
   - `/customer/order` - Order placement flow
   - Cart component
   - Custom instructions per item
   - Order confirmation

### Phase 1.4: Reception Dashboard (3-4 hours)

**Table Management:**
1. Backend:
   - Table model
   - GET `/tables` - Live table status
   - PATCH `/tables/:id/status` - Update table status

2. Frontend:
   - `/reception/tables` - Table status board (grid view)
   - Color-coded status (free/occupied/reserved)
   - Click to change status
   - Real-time updates via Socket.io

**Reservation Management:**
1. Frontend:
   - `/reception/reservations` - All reservations view
   - Filter by date/status
   - Confirm/seat/cancel actions
   - Special requests display

**Waitlist (Walk-ins):**
1. Backend:
   - Waitlist model
   - POST `/waitlist` - Add to queue
   - GET `/waitlist` - Current queue
   - PATCH `/waitlist/:id/seat` - Seat party

2. Frontend:
   - `/reception/waitlist` - Queue management
   - Add walk-in form
   - Queue position display
   - Seat/remove actions

---

## Day 2: Advanced Operations (Gold Tier)

### Phase 2.1: Inventory System (4-5 hours)

**Core Inventory Logic:**
1. Backend:
   - InventoryItem model with total/reserved/available
   - InventoryTransaction model for audit trail
   - Inventory Service (`services/inventory-service.ts`):
     ```typescript
     - reserveStock(itemId, quantity, orderId) // On order placement
     - deductStock(itemId, quantity, orderId) // On kitchen "ready"
     - releaseStock(itemId, quantity, orderId) // On order cancellation
     - restockItem(itemId, quantity, note)
     - adjustStock(itemId, quantity, reason)
     ```
   - All operations wrapped in Prisma transactions
   - Automatic InventoryTransaction logging

2. API Endpoints:
   - GET `/inventory` - List all items with stock levels
   - POST `/inventory` - Add new item
   - POST `/inventory/:id/restock` - Log restock
   - POST `/inventory/:id/adjust` - Manual adjustment
   - GET `/inventory/low-stock` - Items below threshold
   - GET `/inventory/daily-summary` - Expected vs actual report

3. Frontend:
   - `/inventory/dashboard` - Stock levels overview
   - `/inventory/items` - Item list with filters
   - `/inventory/restock` - Restock form
   - `/inventory/transactions` - Transaction history
   - Low stock alerts (red badges)

**Recipe Integration:**
1. Backend:
   - RecipeItem model (links MenuItem to InventoryItem)
   - Calculate available quantity for menu items based on recipe
   - Update MenuItem.is_available based on ingredient availability

2. Frontend:
   - `/admin/menu/:id/recipe` - Recipe editor
   - Ingredient selector with quantity/unit

### Phase 2.2: Kitchen Operations (3-4 hours)

**Order Queue:**
1. Backend:
   - GET `/orders/active` - Live orders queue
   - PATCH `/orders/:id/items/:itemId/status` - Update item status
   - PATCH `/orders/:id/status` - Update order status
   - Socket events: `order:new`, `order:updated`, `item:status_changed`

2. Frontend:
   - `/kitchen/orders` - Kanban board (Received → Preparing → Ready)
   - Order card with:
     - Table number
     - Items list with custom instructions
     - Allergy warnings (highlighted)
     - Timer since order placed
   - Drag-and-drop or button to change status
   - Real-time updates via Socket.io

**Menu Availability Control:**
1. Backend:
   - PATCH `/menu/:id/availability` - Toggle availability
   - Auto-update when inventory changes
   - Broadcast to all connected clients

2. Frontend:
   - `/kitchen/menu` - Quick availability toggles
   - Bulk actions (mark category unavailable)

### Phase 2.3: Payment System (2-3 hours)

**Payment Flow (ADR-006):**
1. Backend:
   - POST `/orders/:id/pay` - In-app payment (sandbox)
   - PATCH `/orders/:id/mark-paid` - Reception marks paid
   - Payment status tracking in Order model

2. Frontend:
   - `/customer/order/:id/pay` - Payment form (sandbox gateway)
   - `/reception/billing` - Mark orders as paid
   - Payment status badges

### Phase 2.4: Admin Dashboard (4-5 hours)

**Analytics & Reporting:**
1. Backend:
   - GET `/analytics/summary` - Today's metrics
   - GET `/analytics/sales` - Sales data with filters
   - GET `/analytics/popular-items` - Top selling items
   - GET `/analytics/peak-hours` - Busiest times

2. Frontend:
   - `/admin/dashboard` - Overview with cards:
     - Orders today
     - Revenue today
     - Current occupancy
     - Low stock items count
   - Charts (using recharts or similar):
     - Sales trend
     - Popular items bar chart
     - Peak hours heatmap

**Staff Management:**
1. Backend:
   - GET `/users?role=` - List users by role
   - POST `/users/staff` - Create staff account
   - PATCH `/users/:id/status` - Activate/deactivate

2. Frontend:
   - `/admin/staff` - Staff list with filters
   - Create staff form (role selection)
   - Activate/deactivate toggle

**Menu Management:**
1. Frontend:
   - `/admin/menu` - Full menu CRUD
   - Create/edit menu item form
   - Image upload (Supabase Storage)
   - Pricing management

### Phase 2.5: Real-Time Layer (3-4 hours)

**Socket.io Implementation:**
1. Backend (`src/sockets/`):
   - Room structure:
     - `restaurant:main` - All staff
     - `orders:active` - Kitchen + reception
     - `orders:{orderId}` - Customer tracking specific order
     - `tables:status` - Reception + admin
     - `inventory:updates` - Inventory + kitchen + admin
   
   - Events:
     ```typescript
     // Orders
     order:created
     order:updated
     order:cancelled
     order:item_status_changed
     
     // Tables
     table:status_changed
     
     // Inventory
     inventory:stock_changed
     inventory:low_stock_alert
     
     // Reservations
     reservation:created
     reservation:updated
     
     // Notifications
     notification:new
     ```

2. Frontend (`lib/socket-client.ts`):
   - Singleton socket connection
   - Auto-reconnect logic
   - Role-based room subscription
   - Event handlers per component
   - Polling fallback for dropped connections

**Notification System:**
1. Backend:
   - Notification model
   - POST `/notifications` - Create notification
   - GET `/notifications` - User's notifications
   - PATCH `/notifications/:id/read` - Mark as read
   - Socket broadcast on new notification

2. Frontend:
   - Notification bell icon with unread count
   - Notification dropdown/panel
   - Toast notifications for real-time events

---

## Day 3: Intelligence & Polish (Platinum Tier)

### Phase 3.1: AI Features (3-4 hours)

**Gemini Integration:**
1. Backend (`src/services/ai-service.ts`):
   - Initialize Gemini API client
   - Prompt templates for different use cases

2. Demand Forecasting:
   - Analyze historical order data
   - Predict popular items by day/time
   - Suggest inventory levels
   - API: GET `/analytics/forecast?days=7`

3. Smart Inventory Suggestions:
   - Analyze consumption patterns
   - Predict reorder points
   - Generate restock recommendations
   - API: GET `/inventory/suggestions`

4. Personalized Recommendations:
   - Analyze customer order history
   - Suggest dishes based on preferences
   - API: GET `/recommendations` (customer)

5. AI Assistant:
   - Natural language queries for analytics
   - Operational insights
   - API: POST `/ai/query` with prompt

**Frontend Integration:**
1. `/admin/insights` - AI-powered insights dashboard
2. `/inventory/suggestions` - Smart restock recommendations
3. `/customer/recommendations` - Personalized dish suggestions
4. AI chat widget for admin queries

### Phase 3.2: Reviews System (1-2 hours)

**Backend:**
1. Review model
2. POST `/reviews` - Submit review
3. GET `/reviews?orderId=` - Reviews for order
4. GET `/reviews/menu-item/:id` - Reviews for menu item

**Frontend:**
1. `/customer/order/:id/review` - Review form (rating + comment)
2. Display reviews on menu items
3. `/admin/reviews` - All reviews management

### Phase 3.3: Quality Assurance (4-5 hours)

**Testing:**
1. Unit tests (Jest):
   - Inventory reserve/deduct/release logic
   - Auth middleware
   - RBAC middleware
   - Stock calculation functions

2. Integration tests:
   - Order flow end-to-end
   - Concurrent order handling on low stock
   - Real-time sync across roles

3. Manual testing checklist:
   - All API endpoints (Postman collection)
   - All user flows per role
   - Mobile responsiveness
   - Cross-browser compatibility
   - Real-time updates verification

**Bug Fixes & Refinement:**
1. Address any issues found during testing
2. Performance optimization:
   - Database query optimization
   - Frontend bundle size
   - Socket connection efficiency
3. Error handling improvements
4. Loading states and error messages

### Phase 3.4: UI/UX Polish (2-3 hours)

**Design Refinement:**
1. Consistent spacing and typography
2. Smooth transitions and animations
3. Loading skeletons
4. Empty states
5. Error states
6. Success feedback (toasts)

**Accessibility:**
1. Keyboard navigation
2. ARIA labels
3. Color contrast
4. Screen reader support

**Mobile Optimization:**
1. Responsive layouts for all views
2. Touch-friendly controls
3. Mobile menu navigation

### Phase 3.5: Documentation & Deployment (2-3 hours)

**Documentation:**
1. Update README.md:
   - Team name
   - Project description
   - Tech stack
   - User stories completed (Bronze/Silver/Gold/Platinum)
   - AI usage description
   - Setup instructions
   - Hosted link
   - Demo credentials

2. API documentation:
   - Ensure API_SPEC.md is up to date
   - Add example requests/responses

3. Code comments:
   - Document complex logic
   - Add JSDoc for key functions

**Final Deployment:**
1. Environment variables configured on hosting platforms
2. Database migrations run on production
3. Frontend deployed to Vercel
4. Backend deployed to Render
5. Verify all features work in production
6. Test with demo data

**Submission Preparation:**
1. GitHub repository:
   - Set to public
   - Clean commit history
   - Remove any sensitive data
   - Add LICENSE file

2. Presentation (PPT → PDF):
   - Problem statement
   - Solution overview
   - Architecture diagram
   - Key features demo
   - Tech stack
   - AI integration
   - Future enhancements

3. Demo video (optional but recommended):
   - 3-5 minute walkthrough
   - Show all user roles
   - Highlight real-time features
   - Demonstrate AI capabilities

---

## Critical Success Factors

### Must-Have Features (Bronze/Silver):
- ✅ Working authentication (email + Google OAuth)
- ✅ Role-based access control (5 roles)
- ✅ Menu browsing with live availability
- ✅ Table reservation system
- ✅ Order placement and tracking
- ✅ Reception table management
- ✅ Basic notifications

### Differentiators (Gold):
- ✅ Real-time inventory integration
- ✅ Automatic stock reserve/deduct on orders
- ✅ Kitchen order queue with status updates
- ✅ Admin analytics dashboard
- ✅ Real-time sync across all roles via Socket.io

### Wow Factors (Platinum):
- ✅ AI-powered demand forecasting
- ✅ Personalized recommendations
- ✅ Smart inventory suggestions
- ✅ AI assistant for operational queries

### Technical Excellence:
- ✅ Clean, well-structured code
- ✅ Meaningful commit history
- ✅ Proper error handling
- ✅ Responsive design
- ✅ Production-ready deployment
- ✅ Comprehensive documentation

---

## Risk Mitigation

### High-Risk Areas:
1. **Inventory Concurrency:** Multiple simultaneous orders on low stock
   - Mitigation: Prisma transactions + optimistic locking
   - Test early and thoroughly

2. **Real-time Sync:** Socket.io connection stability
   - Mitigation: Polling fallback, auto-reconnect
   - Test with multiple clients

3. **OAuth Integration:** Google OAuth callback handling
   - Mitigation: Use well-tested library (passport)
   - Test early in development

4. **Deployment:** Platform-specific issues
   - Mitigation: Deploy skeleton early (Day 1)
   - Test frequently throughout development

### Time Management:
- Prioritize Bronze → Silver → Gold → Platinum in order
- Don't get stuck on polish early
- Working > Perfect
- Cut Platinum features if running behind schedule

---

## Daily Checkpoints

### End of Day 1:
- [ ] Authentication working (login, register, OAuth)
- [ ] Basic customer menu browsing
- [ ] Reservation creation
- [ ] Reception table board
- [ ] Both apps deployed and accessible

### End of Day 2:
- [ ] Inventory system operational
- [ ] Kitchen order queue functional
- [ ] Real-time updates working
- [ ] Payment flow implemented
- [ ] Admin dashboard with analytics

### End of Day 3:
- [ ] AI features integrated
- [ ] All testing complete
- [ ] UI polished
- [ ] Documentation complete
- [ ] Submission ready

---

## Next Steps

1. **Immediate Actions:**
   - Set up Supabase project and get connection string
   - Initialize Prisma schema
   - Create backend folder structure
   - Create frontend role-based routes
   - Deploy skeleton apps to Vercel/Render

2. **Switch to Code Mode:**
   - Once this plan is approved, switch to `code` mode to begin implementation
   - Start with Phase 1.1: Project Setup & Infrastructure

3. **Track Progress:**
   - Update TASKS.md as features are completed
   - Log any architectural decisions in DECISIONS.md
   - Commit frequently with meaningful messages

---

## Resources & References

- **System Docs:** `/system/*.md` (PRD, Architecture, Database, API Spec, etc.)
- **Tech Stack:** Next.js 14, Express, Prisma, Supabase, Socket.io, Tailwind
- **Hosting:** Vercel (frontend), Render (backend), Supabase (database)
- **AI:** Google Gemini API
- **Submission:** GitHub public repo + PPT/PDF + hosted link

---

**Ready to build! 🚀**
