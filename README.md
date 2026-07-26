# Vibeathon 6.0 - Smart Restaurant Management System

A full-stack SaaS platform that digitizes restaurant operations end-to-end, from customer reservations to kitchen fulfillment and inventory tracking.

## 🚀 Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React Context + Hooks
- **Real-time:** Socket.io Client
- **HTTP Client:** Axios

### Backend
- **Runtime:** Node.js 20
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma
- **Real-time:** Socket.io
- **Authentication:** JWT + bcrypt
- **Validation:** Zod

### Infrastructure
- **Frontend Hosting:** Vercel
- **Backend Hosting:** Render
- **Database:** Supabase (PostgreSQL)
- **Version Control:** GitHub

## 📋 Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Supabase account (free tier)
- Git

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Vibeathon6.0
```

### 2. Set Up Supabase Database

1. Go to [Supabase](https://supabase.com) and create a new project
2. Wait for the database to be provisioned
3. Go to Project Settings → Database
4. Copy the connection string (URI format)
5. Replace `[YOUR-PASSWORD]` with your actual database password

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env and add your configuration:
# - DATABASE_URL: Your Supabase connection string
# - JWT_SECRET: Generate a random secret (e.g., openssl rand -base64 32)
# - JWT_REFRESH_SECRET: Generate another random secret
# - EMAIL_* variables: Configure your email provider (Gmail recommended)
# - GOOGLE_CLIENT_ID/SECRET: From Google Cloud Console (optional for now)

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server
npm run dev
```

The backend will start on `http://localhost:5000`

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_RESTAURANT_ID=default-restaurant-id
NEXT_PUBLIC_RESTAURANT_NAME=Smart Restaurant
EOF

# Start development server
npm run dev
```

The frontend will start on `http://localhost:3000`

## 📁 Project Structure

```
Vibeathon6.0/
├── backend/
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── controllers/     # Request/response logic
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Auth, RBAC, error handling
│   │   ├── sockets/         # Socket.io event handlers
│   │   ├── utils/           # Helper functions
│   │   ├── config/          # Configuration files
│   │   └── index.ts         # Entry point
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
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
│   ├── lib/                 # Utilities (API, Socket, Auth)
│   ├── hooks/               # Custom React hooks
│   └── package.json
├── system/                  # Project documentation
│   ├── PRD.md              # Product requirements
│   ├── ARCHITECTURE.md     # System architecture
│   ├── DATABASE.md         # Data model
│   ├── API_SPEC.md         # API documentation
│   ├── TECH_STACK.md       # Technology choices
│   └── TASKS.md            # Implementation tracker
└── IMPLEMENTATION_PLAN.md  # Detailed build plan
```

## 🎯 Current Implementation Status

### ✅ Completed
- Project structure setup (backend & frontend)
- Prisma schema with all models
- Authentication system (backend):
  - Email/password registration with OTP
  - Login with JWT tokens
  - Auth middleware and RBAC
  - Password hashing with bcrypt
- Frontend authentication:
  - Login page
  - Registration page with OTP verification
  - Auth context provider
  - API client with token management
  - Socket client setup

### 🚧 In Progress
- Google OAuth integration
- Menu management system
- Reservation system
- Order management
- Table management

### 📝 Pending
- Reception dashboard
- Kitchen operations
- Inventory system
- Admin dashboard
- Real-time Socket.io events
- Payment integration
- Reviews system
- AI features (Gemini integration)

## 🔑 User Roles

The system supports 5 distinct roles:

1. **Customer** - Browse menu, make reservations, place orders, track status, leave reviews
2. **Reception** - Manage tables, reservations, waitlist, assist with orders, handle payments
3. **Kitchen** - View order queue, update order status, manage dish availability
4. **Inventory** - Track stock levels, log restocks, manage inventory transactions
5. **Admin** - Manage staff, view analytics, configure menu, access all features

## 🔐 Authentication Flow

1. **Registration:**
   - User provides name, email, password, phone (optional)
   - System generates 6-digit OTP and sends via email
   - User verifies OTP to activate account
   - JWT tokens issued upon successful verification

2. **Login:**
   - User provides email and password
   - System validates credentials
   - JWT access token (15min) and refresh token (7d) issued
   - Socket connection established with token

3. **Google OAuth:** (Coming soon)
   - One-click sign in with Google account
   - Auto-creates user account if new
   - Immediate access without OTP verification

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/verify-otp` - Verify OTP
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/resend-otp` - Resend OTP
- `GET /api/v1/auth/me` - Get current user (protected)
- `POST /api/v1/auth/logout` - Logout (protected)

### Coming Soon
- Menu management
- Reservations
- Orders
- Tables
- Inventory
- Analytics
- Reviews

See `system/API_SPEC.md` for complete API documentation.

## 🧪 Testing

```bash
# Backend tests (when implemented)
cd backend
npm test

# Frontend tests (when implemented)
cd frontend
npm test
```

## 🚀 Deployment

### Backend (Render)
1. Create new Web Service on Render
2. Connect GitHub repository
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add environment variables from `.env`
6. Deploy

### Frontend (Vercel)
1. Import project from GitHub
2. Framework preset: Next.js
3. Root directory: `frontend`
4. Add environment variables
5. Deploy

### Database (Supabase)
- Already hosted on Supabase
- Run migrations: `npm run prisma:migrate`

## 📚 Documentation

- **PRD:** `system/PRD.md` - Product requirements and features
- **Architecture:** `system/ARCHITECTURE.md` - System design
- **Database:** `system/DATABASE.md` - Data models and relationships
- **API Spec:** `system/API_SPEC.md` - Complete API documentation
- **Tech Stack:** `system/TECH_STACK.md` - Technology decisions
- **Tasks:** `system/TASKS.md` - Implementation progress
- **Implementation Plan:** `IMPLEMENTATION_PLAN.md` - Detailed build plan

## 🤝 Contributing

This is a hackathon project for Vibeathon 6.0 (July 25-27, 2026).

## 📄 License

MIT License

## 👥 Team

[Add team member names here]

## 🎉 Acknowledgments

- Vibeathon 6.0 organizers
- Supabase for database hosting
- Vercel for frontend hosting
- Render for backend hosting

---

**Built with ❤️ for Vibeathon 6.0**
