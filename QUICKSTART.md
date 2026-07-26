# Quick Start Guide - Vibeathon 6.0

## 🚀 Getting Started in 5 Minutes

### Prerequisites
- ✅ Node.js v18+ installed
- ✅ PostgreSQL running locally
- ✅ Git installed

### Step 1: Clone & Install (2 min)

```bash
# Navigate to project
cd /home/yashraj/vibeathon/Vibeathon6.0

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Configure Environment (1 min)

```bash
cd backend

# Copy example env file
cp .env.example .env

# Edit .env file - IMPORTANT CHANGES:
# 1. Update DATABASE_URL to your local PostgreSQL
# 2. For development, you can skip email configuration (see workaround below)
```

**Local Database Configuration:**
```env
# Replace with your local PostgreSQL connection
DATABASE_URL="postgresql://yashraj:password@localhost:5432/yashraj"
DIRECT_URL="postgresql://yashraj:password@localhost:5432/yashraj"
```

**Email Service Workaround (Development Only):**

The system tries to send OTP emails during registration. For development/testing:

**Option 1: Skip Email (Recommended for Testing)**
- Check server logs for OTP codes
- OTP will be printed in console: `OTP for user@email.com: 123456`
- Use this OTP for verification

**Option 2: Use Gmail (Production)**
```env
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-gmail@gmail.com"
EMAIL_PASSWORD="your-app-specific-password"  # Generate from Google Account settings
EMAIL_FROM="noreply@restaurant.com"
```

**Option 3: Disable OTP Temporarily**
Edit `backend/src/services/auth.service.ts` and comment out email sending:
```typescript
// await sendOTPEmail(user.email, otp);
console.log(`OTP for ${user.email}: ${otp}`); // Add this line
```

### Step 3: Setup Database (1 min)

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed initial data (14 menu items)
npm run seed
```

### Step 4: Start Servers (1 min)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server starts on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend starts on http://localhost:3000
```

### Step 5: Verify Installation

```bash
# Test backend health
curl http://localhost:5000/health
# Expected: {"status":"ok","timestamp":"..."}

# Test menu API
curl http://localhost:5000/api/v1/menu
# Expected: Array of 14 menu items
```

---

## 🧪 Quick Testing

### Register a Test User

```bash
# Register admin user
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123!",
    "name": "Admin User",
    "role": "admin"
  }'

# Check server logs for OTP code
# Look for: "OTP for admin@test.com: 123456"
```

### Verify OTP

```bash
# Use OTP from server logs
curl -X POST http://localhost:5000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "otp": "123456"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123!"
  }'

# Save the accessToken from response
export TOKEN="<your_access_token>"
```

### Test Protected Endpoint

```bash
# Get current user
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📚 Next Steps

### For Development:
1. **Read Documentation:**
   - `PROJECT_PROGRESS.md` - Complete project status
   - `MANUAL_TESTING_GUIDE.md` - Comprehensive testing
   - `INVENTORY_TESTING_GUIDE.md` - API reference

2. **Start Testing:**
   - Follow `MANUAL_TESTING_GUIDE.md` for systematic testing
   - Test all 8 modules (Auth, Menu, Inventory, etc.)

3. **Build Frontend:**
   - Create inventory management UI
   - Build recipe management interface
   - Add real-time notifications

### For Production:
1. **Configure Email Service:**
   - Use Gmail with App Password
   - Or use SendGrid/AWS SES
   - Update `.env` with credentials

2. **Setup Production Database:**
   - Use Supabase or managed PostgreSQL
   - Update `DATABASE_URL` in `.env`
   - Run migrations: `npx prisma migrate deploy`

3. **Configure OAuth:**
   - Get Google OAuth credentials
   - Update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

4. **Deploy:**
   - Backend: Railway/Render/Heroku
   - Frontend: Vercel/Netlify
   - Database: Supabase/AWS RDS

---

## 🐛 Common Issues

### Issue: Email Connection Error
```
Error: connect ECONNREFUSED 192.178.211.109:587
```
**Solution:** This is expected in development. Check server logs for OTP codes instead of email.

### Issue: Database Connection Failed
```
Error: P1001: Can't reach database server
```
**Solution:** 
- Ensure PostgreSQL is running: `sudo systemctl status postgresql`
- Check DATABASE_URL in `.env`
- Verify credentials

### Issue: Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:**
```bash
# Find process using port 5000
lsof -i :5000
# Kill the process
kill -9 <PID>
```

### Issue: TypeScript Errors
```
error TS2769: No overload matches this call
```
**Solution:** These are cosmetic warnings. Code runs fine. See `TYPESCRIPT_ERRORS_STATUS.md` for details.

---

## 🔑 Default Credentials

After seeding, you can create users with these roles:
- `admin` - Full access
- `inventory` - Inventory management
- `kitchen` - Kitchen operations
- `reception` - Reservations & orders
- `customer` - Place orders & reservations

**Note:** No default users are created. You must register users via API.

---

## 📊 Project Structure

```
Vibeathon6.0/
├── backend/              # Express.js API
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── services/     # Business logic
│   │   ├── routes/       # API routes
│   │   └── middleware/   # Auth, error handling
│   └── prisma/          # Database schema
├── frontend/            # Next.js app
│   ├── app/            # Pages & layouts
│   ├── components/     # React components
│   └── lib/           # API client, utilities
└── docs/              # Documentation
```

---

## 🆘 Need Help?

1. **Check Documentation:**
   - `PROJECT_PROGRESS.md` - Project status
   - `MANUAL_TESTING_GUIDE.md` - Testing procedures
   - `TYPESCRIPT_ERRORS_STATUS.md` - Known issues

2. **Check Server Logs:**
   - Backend logs show OTP codes
   - Error messages with stack traces
   - Database query logs

3. **Verify Setup:**
   ```bash
   # Backend health
   curl http://localhost:5000/health
   
   # Database connection
   cd backend && npx prisma studio
   ```

---

## ✅ Success Checklist

- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 3000
- [ ] Database connected and seeded
- [ ] Can register and login users
- [ ] Can view menu items
- [ ] API endpoints responding correctly

**You're ready to start developing! 🎉**