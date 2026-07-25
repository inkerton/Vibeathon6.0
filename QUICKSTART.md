# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Set Up Supabase (2 minutes)

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - Name: `vibeathon-restaurant`
   - Database Password: (generate a strong password and save it!)
   - Region: Choose closest to you
4. Click "Create new project" and wait ~2 minutes
5. Once ready, go to **Settings → Database**
6. Copy the **Connection String** (URI format)
7. Replace `[YOUR-PASSWORD]` with your actual password

### Step 2: Configure Backend (1 minute)

```bash
cd backend

# Create .env file
cat > .env << 'EOF'
# Database
DATABASE_URL="your-supabase-connection-string-here"

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET="your-jwt-secret-here"
JWT_REFRESH_SECRET="your-refresh-secret-here"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"

# Email (Gmail example)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
EMAIL_FROM="noreply@restaurant.com"

# Restaurant
RESTAURANT_ID="default-restaurant-id"
RESTAURANT_NAME="Smart Restaurant"
EOF

# Install and setup
npm install
npm run prisma:generate
npm run prisma:migrate
```

**Gmail App Password Setup:**
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Search "App passwords"
4. Generate password for "Mail"
5. Use this password in EMAIL_PASSWORD

### Step 3: Configure Frontend (30 seconds)

```bash
cd ../frontend

# Create .env.local
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_RESTAURANT_ID=default-restaurant-id
NEXT_PUBLIC_RESTAURANT_NAME=Smart Restaurant
EOF

npm install
```

### Step 4: Start Development Servers (30 seconds)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Step 5: Test It Out! 🎉

1. Open browser: `http://localhost:3000`
2. Click "Create a new account"
3. Fill in registration form
4. Check your email for OTP
5. Enter OTP to verify
6. You're in! 🚀

## 🔧 Troubleshooting

### Database Connection Error
- Check DATABASE_URL is correct
- Ensure password has no special characters that need URL encoding
- Verify Supabase project is active

### Email Not Sending
- Check Gmail app password is correct
- Ensure 2-Step Verification is enabled
- Try with a different email provider

### Port Already in Use
```bash
# Backend (change PORT in .env)
PORT=5001

# Frontend (change port)
npm run dev -- -p 3001
```

### Prisma Migration Fails
```bash
# Reset database (WARNING: deletes all data)
npm run prisma:migrate reset

# Or manually in Supabase SQL editor
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

## 📝 Next Steps

After setup is complete:

1. **Create Test Data:**
   - Register multiple users with different roles
   - Use Prisma Studio: `npm run prisma:studio`

2. **Start Building Features:**
   - Follow `IMPLEMENTATION_PLAN.md`
   - Check `system/TASKS.md` for progress tracking

3. **Deploy:**
   - Backend: Render.com
   - Frontend: Vercel
   - See README.md for deployment instructions

## 🆘 Need Help?

- Check `README.md` for detailed documentation
- Review `system/` folder for specifications
- Check `IMPLEMENTATION_PLAN.md` for architecture details

---

**Happy Coding! 🚀**
