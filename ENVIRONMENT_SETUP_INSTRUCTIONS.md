# Environment Setup Instructions

## ✅ Backend CORS Configuration - COMPLETED

The backend has been updated to support multiple origins. Changes made to `backend/src/index.ts`:
- Added support for multiple CORS origins
- Configured to accept requests from localhost and deployed frontends
- Added logging for CORS debugging

## 📝 Frontend Environment Configuration - ACTION REQUIRED

Since `.env` files are gitignored, you need to create them manually:

### Step 1: Create `.env.local` (for connecting to Railway backend)

Create file: `frontend/.env.local`

```env
# API Configuration for deployed Railway backend
NEXT_PUBLIC_API_URL=https://vibeathon60-production.up.railway.app/api/v1
NEXT_PUBLIC_API_MODE=live

# Socket.io URL
NEXT_PUBLIC_SOCKET_URL=https://vibeathon60-production.up.railway.app
```

**Command to create:**
```bash
cd frontend
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=https://vibeathon60-production.up.railway.app/api/v1
NEXT_PUBLIC_API_MODE=live
NEXT_PUBLIC_SOCKET_URL=https://vibeathon60-production.up.railway.app
EOF
```

### Step 2: Create `.env.development.local` (for local backend development)

Create file: `frontend/.env.development.local`

```env
# API Configuration for local backend
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_API_MODE=live

# Socket.io URL
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

**Command to create:**
```bash
cd frontend
cat > .env.development.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_API_MODE=live
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
EOF
```

### Step 3: Create `.env.production` (for Vercel deployment)

Create file: `frontend/.env.production`

```env
# API Configuration for production
NEXT_PUBLIC_API_URL=https://vibeathon60-production.up.railway.app/api/v1
NEXT_PUBLIC_API_MODE=live

# Socket.io URL
NEXT_PUBLIC_SOCKET_URL=https://vibeathon60-production.up.railway.app
```

**Command to create:**
```bash
cd frontend
cat > .env.production << 'EOF'
NEXT_PUBLIC_API_URL=https://vibeathon60-production.up.railway.app/api/v1
NEXT_PUBLIC_API_MODE=live
NEXT_PUBLIC_SOCKET_URL=https://vibeathon60-production.up.railway.app
EOF
```

## 🚂 Railway Environment Variables - ACTION REQUIRED

### Add these environment variables in Railway dashboard:

1. Go to: https://railway.app/project/your-project/service/backend
2. Navigate to: **Variables** tab
3. Add the following variables:

```env
# Frontend URLs (add your actual Vercel URL)
FRONTEND_URL=https://your-vercel-app.vercel.app
VERCEL_URL=https://your-vercel-app.vercel.app

# Keep existing variables:
DATABASE_URL=<already configured>
DIRECT_URL=<already configured>
JWT_SECRET=<already configured>
JWT_REFRESH_SECRET=<already configured>
PORT=5000
NODE_ENV=production
```

**Important:** Replace `https://your-vercel-app.vercel.app` with your actual Vercel deployment URL.

### After adding variables:

1. Click **Deploy** to redeploy with new environment variables
2. Wait for deployment to complete
3. Check logs to verify CORS origins are logged correctly

## 🌐 Vercel Environment Variables - ACTION REQUIRED (if deploying to Vercel)

### Add these environment variables in Vercel dashboard:

1. Go to: https://vercel.com/your-project/settings/environment-variables
2. Add the following variables for **Production**, **Preview**, and **Development**:

```env
NEXT_PUBLIC_API_URL=https://vibeathon60-production.up.railway.app/api/v1
NEXT_PUBLIC_API_MODE=live
NEXT_PUBLIC_SOCKET_URL=https://vibeathon60-production.up.railway.app
```

3. Redeploy your frontend after adding variables

## 🧪 Testing Instructions

### Test 1: Local Frontend → Railway Backend

```bash
# 1. Create .env.local (see Step 1 above)
cd frontend

# 2. Start frontend
npm run dev

# 3. Open browser to http://localhost:3000/auth/login
# 4. Try to login
# 5. Check browser console for API calls
# 6. Should see: POST https://vibeathon60-production.up.railway.app/api/v1/auth/login
```

**Expected Result:** Login should work without CORS errors

### Test 2: Local Frontend → Local Backend

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend with development env
cd frontend
npm run dev

# Open browser to http://localhost:3000/auth/login
# Try to login
```

**Expected Result:** Login should work with local backend

### Test 3: Verify CORS Configuration

```bash
# Test CORS preflight from localhost
curl -X OPTIONS https://vibeathon60-production.up.railway.app/api/v1/auth/login \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Should return:
# Access-Control-Allow-Origin: http://localhost:3000
# Access-Control-Allow-Credentials: true
```

### Test 4: Check Railway Logs

```bash
# After creating frontend .env.local and restarting dev server:
# 1. Try to login from http://localhost:3000
# 2. Check Railway logs for:
#    - "🌍 Allowed CORS origins: ..." (should include localhost:3000)
#    - POST /api/v1/auth/login requests
#    - No "⚠️ CORS blocked origin" warnings
```

## 🔍 Troubleshooting

### Issue: Still getting "Network Error"

**Solution:**
1. Verify `.env.local` exists in `frontend/` directory
2. Restart Next.js dev server (`npm run dev`)
3. Check browser console for actual API URL being called
4. Should be: `https://vibeathon60-production.up.railway.app/api/v1/auth/login`

### Issue: "Not allowed by CORS"

**Solution:**
1. Check Railway logs for "⚠️ CORS blocked origin: ..."
2. Add that origin to Railway's `FRONTEND_URL` or `VERCEL_URL`
3. Redeploy backend on Railway
4. Clear browser cache and cookies

### Issue: Environment variables not loading

**Solution:**
1. Verify file names are exact: `.env.local` (not `.env.local.txt`)
2. Restart Next.js dev server after creating/modifying .env files
3. Check that variables start with `NEXT_PUBLIC_` for client-side access
4. Run: `npm run dev` (not just refresh browser)

### Issue: Works locally but not on Vercel

**Solution:**
1. Verify Vercel environment variables are set correctly
2. Check Vercel deployment logs for build errors
3. Ensure `.env.production` is committed to git (it's safe, contains public URLs)
4. Redeploy after environment variable changes

## 📋 Quick Setup Commands

Run these commands to set up everything quickly:

```bash
# 1. Create frontend environment files
cd frontend

# For Railway backend (default)
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=https://vibeathon60-production.up.railway.app/api/v1
NEXT_PUBLIC_API_MODE=live
NEXT_PUBLIC_SOCKET_URL=https://vibeathon60-production.up.railway.app
EOF

# For local development
cat > .env.development.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_API_MODE=live
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
EOF

# For production builds
cat > .env.production << 'EOF'
NEXT_PUBLIC_API_URL=https://vibeathon60-production.up.railway.app/api/v1
NEXT_PUBLIC_API_MODE=live
NEXT_PUBLIC_SOCKET_URL=https://vibeathon60-production.up.railway.app
EOF

# 2. Restart frontend
npm run dev

# 3. Test login at http://localhost:3000/auth/login
```

## ✅ Verification Checklist

- [ ] Backend CORS updated (✅ Already done)
- [ ] Created `frontend/.env.local`
- [ ] Created `frontend/.env.development.local`
- [ ] Created `frontend/.env.production`
- [ ] Added `FRONTEND_URL` to Railway
- [ ] Added `VERCEL_URL` to Railway (if using Vercel)
- [ ] Redeployed backend on Railway
- [ ] Tested login from localhost → Railway backend
- [ ] Verified CORS headers with curl
- [ ] Checked Railway logs for CORS origins
- [ ] (Optional) Added environment variables to Vercel
- [ ] (Optional) Tested deployed Vercel frontend

## 🎯 Expected Final State

After completing all steps:

1. **Local Development:**
   - Frontend connects to local backend (port 5000)
   - Uses `.env.development.local`

2. **Testing with Railway:**
   - Frontend connects to Railway backend
   - Uses `.env.local`
   - No CORS errors

3. **Production (Vercel):**
   - Frontend connects to Railway backend
   - Uses `.env.production` or Vercel environment variables
   - No CORS errors
   - All API calls work correctly

## 📞 Need Help?

If you encounter issues:

1. Check browser console for exact error messages
2. Check Railway logs for backend errors
3. Verify environment variables are loaded: `console.log(process.env.NEXT_PUBLIC_API_URL)`
4. Test with curl to isolate frontend vs backend issues
5. Refer to `DEPLOYMENT_CORS_FIX_PLAN.md` for detailed troubleshooting
