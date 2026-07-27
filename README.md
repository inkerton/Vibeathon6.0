# Vibeathon 6.0 - Smart Restaurant Management System

> **🎉 Hackathon Submission - July 27, 2026**  
> A full-stack SaaS platform that digitizes restaurant operations end-to-end, from customer reservations to kitchen fulfillment and inventory tracking.

## 🌐 Live Deployment

- **Frontend (Vercel):** [https://vibeathon6-0.vercel.app](https://vibeathon6-0.vercel.app)
- **Backend (Railway):** [https://vibeathon60-production.up.railway.app](https://vibeathon60-production.up.railway.app)
- **Database:** Supabase (PostgreSQL)

## 🔑 Test Credentials for Judges

### Admin Account
```
Email: admin@restaurant.com
Password: Admin123!
Role: Admin (Full system access)
```

### Staff Accounts
```
Reception:
Email: reception@restaurant.com
Password: Staff123!

Kitchen:
Email: kitchen@restaurant.com
Password: Staff123!

Inventory:
Email: inventory@restaurant.com
Password: Staff123!
```

### Customer Account
```
Email: customer1@example.com
Password: Customer123!
```

**Note:** All test accounts are pre-seeded in the database. You can also register new accounts via the registration page.

## 🚀 Quick Start for Judges

1. Visit [https://vibeathon6-0.vercel.app](https://vibeathon6-0.vercel.app)
2. Click "Login" and use any of the test credentials above
3. Explore the role-specific dashboards:
   - **Admin:** Full system management, analytics, staff management
   - **Reception:** Table management, reservations, order assistance
   - **Kitchen:** Order queue, status updates, dish availability
   - **Inventory:** Stock tracking, restock logging, transactions
   - **Customer:** Menu browsing, ordering, reservations, order tracking

## 🎯 Current Implementation Status (Post-Submission)

### ✅ Fully Implemented & Deployed

#### Authentication System
- ✅ Email/password registration with OTP verification
- ✅ Login with JWT tokens (access + refresh)
- ✅ Role-based access control (RBAC)
- ✅ Password hashing with bcrypt
- ✅ Auth middleware and route protection
- ✅ Google OAuth integration (configured)

#### Admin Dashboard
- ✅ Staff management (CRUD operations)
- ✅ Role assignment and permissions
- ✅ Staff search and filtering
- ✅ Revenue analytics and charts
- ✅ Order statistics dashboard
- ✅ Menu management interface

#### Menu Management
- ✅ Full CRUD operations for menu items
- ✅ Category-based organization
- ✅ Image upload support
- ✅ Availability toggle
- ✅ Price management
- ✅ Dietary tags (vegetarian, vegan, gluten-free)
- ✅ Customer-facing menu with filters

#### Inventory System
- ✅ Stock level tracking
- ✅ Restock logging with supplier info
- ✅ Transaction history
- ✅ Low stock alerts
- ✅ Unit management (kg, liters, pieces)
- ✅ Search and filter capabilities

#### Recipe Management
- ✅ Recipe creation with ingredients
- ✅ Ingredient quantity tracking
- ✅ Recipe-to-menu item linking
- ✅ Preparation instructions
- ✅ Cost calculation

#### Order Management
- ✅ Customer order placement
- ✅ Order status tracking (Pending → Preparing → Ready → Delivered)
- ✅ Kitchen order queue
- ✅ Real-time status updates via Socket.io
- ✅ Order history and details
- ✅ Order timeline visualization

#### Reservation System
- ✅ Table reservation booking
- ✅ Date and time selection
- ✅ Guest count management
- ✅ Special requests handling
- ✅ Reservation status tracking
- ✅ Reception dashboard for reservations

#### Real-time Features
- ✅ Socket.io integration
- ✅ Real-time order status updates
- ✅ Live kitchen notifications
- ✅ Role-based room subscriptions
- ✅ Order tracking for customers

#### Frontend Architecture
- ✅ Next.js 14 with App Router
- ✅ TypeScript throughout
- ✅ Tailwind CSS styling
- ✅ Responsive design (mobile-friendly)
- ✅ Context-based state management
- ✅ Protected routes with auth guards
- ✅ Role-based navigation
- ✅ Error handling and loading states

#### Backend Architecture
- ✅ Express.js REST API
- ✅ Prisma ORM with PostgreSQL
- ✅ JWT authentication
- ✅ CORS configuration for multiple origins
- ✅ Error handling middleware
- ✅ Request validation
- ✅ Database migrations
- ✅ Seed data for testing

#### Deployment & DevOps
- ✅ Frontend deployed on Vercel
- ✅ Backend deployed on Railway
- ✅ Database hosted on Supabase
- ✅ Environment variable management
- ✅ CORS properly configured
- ✅ Production-ready builds
- ✅ Continuous deployment setup



## 🚀 Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** React Context + Hooks
- **Real-time:** Socket.io Client
- **HTTP Client:** Axios with interceptors
- **Deployment:** Vercel

### Backend
- **Runtime:** Node.js 24
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma
- **Real-time:** Socket.io
- **Authentication:** JWT + bcrypt
- **Validation:** Zod (planned)
- **Deployment:** Railway

### Infrastructure
- **Frontend Hosting:** Vercel (Automatic deployments)
- **Backend Hosting:** Railway (Automatic deployments)
- **Database:** Supabase (Managed PostgreSQL)
- **Version Control:** GitHub

## 📋 Prerequisites for Local Development

- Node.js 24.x or higher
- npm or yarn
- PostgreSQL (or Supabase account)
- Git

## 🛠️ Local Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/Vibeathon6.0.git
cd Vibeathon6.0
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration:
# - DATABASE_URL: Your PostgreSQL connection string
# - DIRECT_URL: Direct connection for migrations
# - JWT_SECRET: Generate with: openssl rand -base64 32
# - JWT_REFRESH_SECRET: Generate another random secret
# - FRONTEND_URL: http://localhost:3000
# - PORT: 5000

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed database with test data
npm run seed

# Start development server
npm run dev
```

Backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_API_MODE=live
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
EOF

# Start development server
npm run dev
```

Frontend will run on `http://localhost:3000`

## 📁 Project Structure

```
Vibeathon6.0/
├── backend/
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── controllers/     # Request/response logic
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Auth, RBAC, error handling
│   │   ├── config/          # Passport, database config
│   │   ├── utils/           # Helper functions (JWT, OTP, email)
│   │   └── index.ts         # Entry point with Socket.io
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.ts          # Test data seeding
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── customer/        # Customer-facing pages
│   │   ├── reception/       # Reception dashboard
│   │   ├── kitchen/         # Kitchen operations
│   │   ├── inventory/       # Inventory management
│   │   ├── admin/           # Admin dashboard
│   │   └── auth/            # Authentication pages
│   ├── components/          # Shared UI components
│   │   └── ui/             # shadcn/ui components
│   ├── lib/                 # Utilities (API, Socket, Auth)
│   └── package.json
├── DEPLOYMENT_CORS_FIX_PLAN.md      # CORS troubleshooting guide
├── ENVIRONMENT_SETUP_INSTRUCTIONS.md # Deployment setup guide
└── README.md                         # This file
```

## 🎯 Key Features Demonstrated

### 1. Role-Based Access Control (RBAC)
- 5 distinct user roles with specific permissions
- Protected routes based on user role
- Role-specific dashboards and navigation
- Middleware-based authorization

### 2. Real-time Updates
- Socket.io integration for live updates
- Order status changes broadcast to kitchen and customers
- Room-based subscriptions (role, restaurant, order)
- Automatic reconnection handling

### 3. Complete Order Flow
- Customer browses menu and places order
- Kitchen receives order in queue
- Kitchen updates status (Preparing → Ready → Delivered)
- Customer sees real-time status updates
- Order history and tracking

### 4. Inventory Management
- Track stock levels for ingredients
- Log restocks with supplier information
- View transaction history
- Low stock alerts
- Integration with recipe management

### 5. Staff Management
- Admin can create, update, delete staff
- Role assignment and permissions
- Search and filter staff members
- Staff authentication and access control

### 6. Responsive Design
- Mobile-first approach
- Works on all screen sizes
- Touch-friendly interfaces
- Optimized for tablets and phones

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/verify-otp` - Verify OTP
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/resend-otp` - Resend OTP
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/logout` - Logout

### Menu Management
- `GET /api/v1/menu` - Get all menu items
- `GET /api/v1/menu/:id` - Get menu item by ID
- `POST /api/v1/menu` - Create menu item (Admin)
- `PUT /api/v1/menu/:id` - Update menu item (Admin)
- `DELETE /api/v1/menu/:id` - Delete menu item (Admin)

### Orders
- `GET /api/v1/orders` - Get all orders
- `GET /api/v1/orders/:id` - Get order by ID
- `POST /api/v1/orders` - Create order (Customer)
- `PUT /api/v1/orders/:id/status` - Update order status (Kitchen)

### Reservations
- `GET /api/v1/reservations` - Get all reservations
- `GET /api/v1/reservations/:id` - Get reservation by ID
- `POST /api/v1/reservations` - Create reservation (Customer)
- `PUT /api/v1/reservations/:id` - Update reservation (Reception)

### Inventory
- `GET /api/v1/inventory` - Get all inventory items
- `GET /api/v1/inventory/:id` - Get inventory item by ID
- `POST /api/v1/inventory` - Create inventory item (Inventory)
- `PUT /api/v1/inventory/:id` - Update inventory item (Inventory)
- `POST /api/v1/inventory/:id/restock` - Log restock (Inventory)

### Staff Management
- `GET /api/v1/staff` - Get all staff (Admin)
- `GET /api/v1/staff/:id` - Get staff by ID (Admin)
- `POST /api/v1/staff` - Create staff (Admin)
- `PUT /api/v1/staff/:id` - Update staff (Admin)
- `DELETE /api/v1/staff/:id` - Delete staff (Admin)

### Recipes
- `GET /api/v1/recipes` - Get all recipes
- `GET /api/v1/recipes/:id` - Get recipe by ID
- `POST /api/v1/recipes` - Create recipe (Admin)
- `PUT /api/v1/recipes/:id` - Update recipe (Admin)
- `DELETE /api/v1/recipes/:id` - Delete recipe (Admin)

## 🧪 Testing the Application

### 1. Authentication Flow
1. Visit the registration page
2. Create a new account with email/password
3. Verify OTP sent to email
4. Login with credentials
5. Access role-specific dashboard

### 2. Customer Journey
1. Login as customer
2. Browse menu with filters (category, dietary)
3. Add items to cart
4. Place order
5. Track order status in real-time
6. View order history

### 3. Kitchen Operations
1. Login as kitchen staff
2. View order queue
3. Update order status (Preparing → Ready → Delivered)
4. See real-time order updates
5. Manage dish availability

### 4. Admin Functions
1. Login as admin
2. Create new staff members
3. Manage menu items (add, edit, delete)
4. View revenue analytics
5. Monitor order statistics

### 5. Inventory Management
1. Login as inventory staff
2. View current stock levels
3. Log restock transactions
4. Check low stock alerts
5. View transaction history

## 🚀 Deployment Guide

### Frontend (Vercel)
1. Connect GitHub repository to Vercel
2. Set root directory to `frontend`
3. Add environment variables:
   - `NEXT_PUBLIC_API_URL`: Backend URL
   - `NEXT_PUBLIC_API_MODE`: `live`
   - `NEXT_PUBLIC_SOCKET_URL`: Backend URL
4. Deploy automatically on push to main

### Backend (Railway)
1. Connect GitHub repository to Railway
2. Add environment variables from `.env.example`
3. Set build command: `cd backend && npm install && npm run build`
4. Set start command: `cd backend && npx prisma migrate deploy && npm start`
5. Deploy automatically on push to main

### Database (Supabase)
- Already configured and hosted
- Connection strings in Railway environment variables
- Migrations run automatically on deployment

## 🔒 Security Features

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT token-based authentication
- ✅ HTTP-only cookies for refresh tokens (planned)
- ✅ CORS properly configured for multiple origins
- ✅ Environment variables for sensitive data
- ✅ SQL injection protection via Prisma ORM
- ✅ XSS protection via React's built-in escaping
- ✅ Rate limiting (planned)
- ✅ Input validation (planned with Zod)

## 📈 Performance Optimizations

- ✅ Next.js automatic code splitting
- ✅ Image optimization with Next.js Image component
- ✅ API response caching (planned)
- ✅ Database query optimization with Prisma
- ✅ Lazy loading of components
- ✅ Debounced search inputs
- ✅ Optimistic UI updates



## 🔮 Future Enhancements

### Phase 1: Core Features (Next 2 weeks)
- [ ] Complete payment integration (Stripe/Razorpay)
- [ ] Email service configuration (SendGrid/AWS SES)
- [ ] File upload service (AWS S3/Cloudinary)
- [ ] Table management UI
- [ ] Advanced analytics dashboard
- [ ] Reviews and ratings system

### Phase 2: Advanced Features (Next 1 month)
- [ ] AI-powered menu recommendations (Google Gemini)
- [ ] Predictive inventory management
- [ ] Automated reordering based on usage patterns
- [ ] Customer loyalty program
- [ ] QR code menu scanning
- [ ] Waitlist management with SMS notifications

### Phase 3: Scale & Expansion (Next 3 months)
- [ ] Multi-restaurant support (SaaS model)
- [ ] Mobile apps (React Native)
- [ ] Integration with delivery platforms (Uber Eats, DoorDash)
- [ ] Advanced reporting and business intelligence
- [ ] Staff scheduling and shift management
- [ ] Customer feedback and sentiment analysis
- [ ] Marketing automation and campaigns

### Phase 4: Enterprise Features (Next 6 months)
- [ ] White-label solution for restaurant chains
- [ ] API marketplace for third-party integrations
- [ ] Advanced security features (2FA, SSO)
- [ ] Compliance and audit logging
- [ ] Multi-language support
- [ ] Franchise management features
- [ ] Advanced AI features (demand forecasting, dynamic pricing)

## 📊 Technical Achievements

### Architecture
- ✅ Clean separation of concerns (MVC pattern)
- ✅ Modular and scalable codebase
- ✅ Type-safe with TypeScript throughout
- ✅ RESTful API design
- ✅ Real-time capabilities with WebSockets
- ✅ Database schema with proper relationships

### Code Quality
- ✅ Consistent code style
- ✅ Comprehensive error handling
- ✅ Logging for debugging
- ✅ Environment-based configuration
- ✅ Git workflow with meaningful commits

### DevOps
- ✅ Automated deployments (CI/CD)
- ✅ Environment variable management
- ✅ Database migrations
- ✅ Seed data for testing
- ✅ Production-ready builds

## 🤝 Contributing

This project was built for Vibeathon 6.0 hackathon. Contributions are welcome for future enhancements!

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this project for learning or building upon it.

## 👥 Team

**Vibeathon 6.0 Team**
- **[Yashraj](https://github.com/yasshhhraj)** - Full Stack Developer
- **[Janvi](https://github.com/inkerton)** - Full Stack Developer

## 🎉 Acknowledgments

- **Vibeathon 6.0 Organizers** - For hosting this amazing hackathon
- **Supabase** - For providing free PostgreSQL hosting
- **Vercel** - For seamless frontend deployment
- **Railway** - For reliable backend hosting
- **shadcn/ui** - For beautiful UI components
- **Next.js Team** - For the amazing framework
- **Prisma Team** - For the excellent ORM

---

**🏆 Built with ❤️ for Vibeathon 6.0 Hackathon - July 25-27, 2026**

**⭐ If you find this project useful, please consider giving it a star on GitHub!**