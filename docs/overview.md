# Smart Restaurant Management System - Overview

## System Architecture

This is a full-stack restaurant management system built with modern web technologies, designed to handle multiple user roles and real-time operations.

### Technology Stack

#### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js 5.2.1
- **Database**: PostgreSQL with Prisma ORM 6.2.1
- **Real-time**: Socket.io 4.8.3
- **Authentication**: JWT + Passport.js (Google OAuth 2.0)
- **Security**: Helmet, bcrypt, CORS
- **Validation**: Zod, express-validator

#### Frontend
- **Framework**: Next.js 16.2.11 (React 19.2.4)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: Material-UI 9.2.0, shadcn/ui
- **State Management**: TanStack React Query 5.101.4
- **Real-time**: Socket.io-client 4.8.3
- **HTTP Client**: Axios 1.18.1
- **Forms**: React Hook Form 7.83.0
- **Animation**: Framer Motion 12.42.2

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │  Admin   │ Kitchen  │Reception │Inventory │ Customer │  │
│  │Dashboard │  View    │  View    │  View    │   View   │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
│                           ↕                                  │
│                    API Client Layer                          │
│              (Mock Mode / Live Mode Support)                 │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Express.js)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Authentication Middleware                │  │
│  │         (JWT + Role-based Access Control)            │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │   Auth   │   Menu   │  Orders  │Inventory │  Staff   │  │
│  │ Service  │ Service  │ Service  │ Service  │ Service  │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
│  ┌──────────┬──────────┬──────────────────────────────┐    │
│  │Reservation│ Recipe  │    Socket.io Server          │    │
│  │ Service  │ Service  │  (Real-time Updates)         │    │
│  └──────────┴──────────┴──────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                PostgreSQL Database (Prisma ORM)              │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │  Users   │  Tables  │  Orders  │Inventory │  Menu    │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
│  ┌──────────┬──────────┬──────────┬──────────────────────┐ │
│  │Reservations│Recipes │Reviews   │  Notifications       │ │
│  └──────────┴──────────┴──────────┴──────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## User Roles & Permissions

### 1. Customer
**Access**: Public + Authenticated
- Browse menu with filters (category, availability, price)
- Place orders with custom instructions and allergy info
- Track order status in real-time
- Make and manage reservations
- View order history
- Leave reviews and ratings

### 2. Kitchen Staff
**Access**: Authenticated + Kitchen Role
- View active orders in real-time
- Update order item status (received → preparing → ready → served)
- Toggle menu item availability
- Reserve/deduct inventory for orders
- View preparation times and priorities

### 3. Reception Staff
**Access**: Authenticated + Reception Role
- Manage reservations (view, confirm, seat, cancel)
- View all orders and their status
- Update payment status
- Manage table assignments
- Handle waitlist entries
- View customer information

### 4. Inventory Staff
**Access**: Authenticated + Inventory Role
- View all inventory items and stock levels
- Restock items with transaction logging
- Adjust stock levels (with notes)
- View low stock alerts
- Manage recipes (ingredient requirements)
- Update menu availability based on stock
- View daily inventory summaries
- Track all inventory transactions

### 5. Admin
**Access**: Full System Access
- All permissions from other roles
- Manage staff accounts (CRUD operations)
- Manage menu items (create, update, delete)
- View analytics and reports
- Configure system settings
- Manage recipes and ingredients
- Override any operation

## Core Features

### 1. Authentication & Authorization
- **Local Authentication**: Email/password with OTP verification
- **OAuth**: Google Sign-In integration
- **JWT Tokens**: Secure token-based authentication
- **Role-based Access Control**: Granular permissions per role
- **Password Security**: bcrypt hashing
- **Session Management**: Token refresh mechanism (planned)

### 2. Menu Management
- **CRUD Operations**: Full menu item management (admin only)
- **Categories**: Organized menu structure
- **Availability**: Real-time availability based on inventory
- **Pricing**: Decimal precision for accurate pricing
- **Images**: Support for menu item images
- **Preparation Time**: Estimated cooking time per item
- **Filtering**: Category, availability, and price filters

### 3. Order Management
- **Order Placement**: Customers can place orders with custom instructions
- **Real-time Tracking**: Live order status updates via WebSocket
- **Status Workflow**: 
  - placed → preparing → ready → served → completed
- **Item-level Status**: Individual tracking for each order item
- **Payment Integration**: Multiple payment methods (in-app, pay-at-table)
- **Order History**: Complete order tracking for customers
- **Kitchen Display**: Optimized view for kitchen staff

### 4. Inventory Management
- **Stock Tracking**: Real-time inventory levels
- **Reserved Stock**: Automatic reservation when orders placed
- **Transaction Logging**: Complete audit trail
- **Transaction Types**:
  - Reserve: Lock stock for pending orders
  - Deduct: Remove stock when order completed
  - Restock: Add new inventory
  - Release: Return stock from cancelled orders
  - Adjustment: Manual corrections
- **Low Stock Alerts**: Automatic notifications
- **Reorder Thresholds**: Configurable minimum levels
- **Daily Summaries**: Inventory reports

### 5. Recipe Management
- **Ingredient Mapping**: Link menu items to inventory
- **Quantity Tracking**: Precise ingredient requirements
- **Availability Calculation**: Auto-calculate max servings
- **Bulk Updates**: Efficient recipe modifications
- **Unit Management**: Flexible measurement units

### 6. Reservation System
- **Table Management**: Track table status and capacity
- **Reservation Workflow**:
  - pending → confirmed → seated → completed/cancelled
- **Availability Check**: Real-time table availability
- **Party Size**: Support for different group sizes
- **Special Requests**: Customer notes and preferences
- **Waitlist**: Queue management for walk-ins

### 7. Real-time Updates (Socket.io)
- **Order Updates**: Live status changes
- **Kitchen Notifications**: New order alerts
- **Inventory Alerts**: Low stock warnings
- **Table Status**: Real-time table availability
- **Room-based Broadcasting**:
  - Role-specific rooms (kitchen, reception, etc.)
  - Restaurant-wide updates
  - Order-specific tracking

### 8. Notifications
- **Types**:
  - Reservation confirmations
  - Table ready alerts
  - Order ready notifications
  - Low stock warnings
  - Custom messages
- **User-specific**: Targeted notifications
- **Read/Unread Status**: Track notification state

## API Architecture

### RESTful Endpoints
- **Base URL**: `/api/v1`
- **Authentication**: Bearer token in Authorization header
- **Response Format**: Consistent JSON structure
- **Error Handling**: Centralized error middleware
- **Validation**: Request validation with express-validator and Zod

### API Modules
1. **Auth** (`/auth`): Registration, login, OTP, OAuth
2. **Menu** (`/menu`): Menu item CRUD and filtering
3. **Orders** (`/orders`): Order management and tracking
4. **Reservations** (`/reservations`): Reservation system
5. **Inventory** (`/inventory`): Stock management
6. **Recipes** (`/recipes`): Recipe and ingredient management
7. **Staff** (`/staff`): Staff account management (admin only)
8. **Seed** (`/seed`): Database seeding utilities

## Frontend Architecture

### Page Structure
```
/
├── / (landing page)
├── /auth
│   ├── /login
│   ├── /register
│   └── /google (OAuth callback)
├── /admin
│   ├── / (dashboard)
│   ├── /staff
│   ├── /menu
│   ├── /inventory
│   └── /recipes
├── /kitchen
│   └── / (active orders)
├── /reception
│   ├── / (dashboard)
│   └── /reservations
├── /inventory
│   ├── / (dashboard)
│   └── /transactions
└── /customer
    ├── /menu
    ├── /orders
    ├── /checkout
    └── /reservations
```

### Key Features
- **Role-based Routing**: Automatic redirection based on user role
- **Protected Routes**: Authentication middleware
- **Mock API Mode**: Development without backend
- **Responsive Design**: Mobile-first approach
- **Real-time Updates**: WebSocket integration
- **Optimistic UI**: Instant feedback for user actions
- **Error Handling**: Comprehensive error boundaries
- **Loading States**: Skeleton loaders and spinners

## Data Flow

### Order Placement Flow
```
1. Customer selects menu items
2. Frontend validates selection
3. API checks inventory availability
4. Inventory reserves required stock
5. Order created in database
6. WebSocket notifies kitchen staff
7. Customer receives order confirmation
8. Real-time status updates via WebSocket
```

### Inventory Management Flow
```
1. Order placed → Reserve stock
2. Kitchen starts preparing → Stock remains reserved
3. Order completed → Deduct reserved stock
4. Order cancelled → Release reserved stock
5. Low stock detected → Notify inventory staff
6. Restock performed → Update total stock
7. Menu availability updated automatically
```

## Security Features

1. **Authentication**
   - JWT token-based authentication
   - Secure password hashing with bcrypt
   - OTP verification for registration
   - OAuth 2.0 integration

2. **Authorization**
   - Role-based access control (RBAC)
   - Route-level permission checks
   - Resource-level authorization

3. **API Security**
   - Helmet.js for HTTP headers
   - CORS configuration
   - Request validation
   - Rate limiting (planned)

4. **Data Protection**
   - Environment variable management
   - Secure token storage
   - SQL injection prevention (Prisma)
   - XSS protection

## Deployment

### Backend
- **Platform**: Railway / Vercel / Custom server
- **Database**: PostgreSQL (managed service recommended)
- **Environment Variables**: 
  - DATABASE_URL
  - JWT_SECRET
  - GOOGLE_CLIENT_ID/SECRET
  - FRONTEND_URL
  - PORT

### Frontend
- **Platform**: Vercel (recommended) / Netlify
- **Build Command**: `npm run build`
- **Environment Variables**:
  - NEXT_PUBLIC_API_URL
  - NEXT_PUBLIC_API_MODE (mock/live)

## Development Modes

### Mock API Mode
- **Purpose**: Frontend development without backend
- **Activation**: `NEXT_PUBLIC_API_MODE=mock`
- **Features**:
  - In-memory state management
  - Simulated API responses
  - Realistic delays
  - Full CRUD operations

### Live API Mode
- **Purpose**: Production and integration testing
- **Activation**: `NEXT_PUBLIC_API_MODE=live`
- **Features**:
  - Real backend connection
  - WebSocket support
  - Actual database operations

## Future Enhancements

1. **Analytics Dashboard**: Revenue, popular items, peak hours
2. **AI Recommendations**: Personalized menu suggestions
3. **Multi-restaurant Support**: Franchise management
4. **Mobile Apps**: Native iOS/Android applications
5. **Payment Gateway**: Stripe/PayPal integration
6. **Loyalty Program**: Points and rewards system
7. **Table QR Codes**: Self-service ordering
8. **Kitchen Display System**: Dedicated hardware interface
9. **Delivery Integration**: Third-party delivery services
10. **Advanced Reporting**: Custom reports and exports

## Performance Considerations

1. **Database Optimization**
   - Indexed queries
   - Connection pooling
   - Query optimization

2. **Frontend Performance**
   - Code splitting
   - Lazy loading
   - Image optimization
   - Caching strategies

3. **Real-time Efficiency**
   - Room-based broadcasting
   - Event throttling
   - Connection management

## Monitoring & Logging

- **Backend Logging**: Console-based (production logger recommended)
- **Error Tracking**: Centralized error handler
- **Performance Monitoring**: (To be implemented)
- **Database Monitoring**: Prisma query logging

## Support & Maintenance

- **Documentation**: Comprehensive API and system docs
- **Testing**: Manual testing guides provided
- **Deployment**: Quick deployment guides available
- **Troubleshooting**: Common issues documented
