# Deployment CORS and API Connection Fix Plan

## Problem Analysis

### Current Issue
- Frontend works with local backend but fails with deployed Railway backend
- Error: `AxiosError: Network Error` when trying to login
- Backend doesn't receive POST requests from frontend
- cURL to backend works fine (confirms backend is operational)

### Root Causes Identified

1. **Frontend API URL Configuration**
   - Frontend `api-client.ts` uses: `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'`
   - No `.env.local` file exists in frontend directory
   - **Result**: Frontend is trying to connect to `localhost:5000` instead of Railway URL `https://vibeathon60-production.up.railway.app/api/v1`

2. **Backend CORS Configuration**
   - Backend only allows single origin: `process.env.FRONTEND_URL || 'http://localhost:3000'`
   - Cannot handle multiple origins (localhost + Vercel deployment)
   - **Result**: CORS blocks requests from origins not matching the configured URL

3. **Missing Environment Variables**
   - Frontend: No `NEXT_PUBLIC_API_URL` configured
   - Backend: `FRONTEND_URL` likely set to single origin on Railway

## Solution Steps

### Step 1: Create Frontend Environment File

Create `frontend/.env.local`:
```env
# API Configuration
NEXT_PUBLIC_API_URL=https://vibeathon60-production.up.railway.app/api/v1
NEXT_PUBLIC_API_MODE=live

# Optional: Socket.io URL (if different)
NEXT_PUBLIC_SOCKET_URL=https://vibeathon60-production.up.railway.app
```

For local development, create `frontend/.env.development.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_API_MODE=live
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

### Step 2: Update Backend CORS Configuration

Modify `backend/src/index.ts` to accept multiple origins:

```typescript
// Current (single origin):
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Updated (multiple origins):
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL,
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Update Socket.io CORS similarly
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});
```

### Step 3: Configure Railway Environment Variables

Add these environment variables in Railway dashboard:

```env
# Frontend URLs (comma-separated for multiple)
FRONTEND_URL=https://your-vercel-app.vercel.app
VERCEL_URL=https://your-vercel-app.vercel.app

# Existing variables (keep these)
DATABASE_URL=<your-database-url>
DIRECT_URL=<your-direct-url>
JWT_SECRET=<your-jwt-secret>
JWT_REFRESH_SECRET=<your-refresh-secret>
PORT=5000
NODE_ENV=production
```

### Step 4: Update Frontend for Vercel Deployment

Create `frontend/.env.production`:
```env
NEXT_PUBLIC_API_URL=https://vibeathon60-production.up.railway.app/api/v1
NEXT_PUBLIC_API_MODE=live
NEXT_PUBLIC_SOCKET_URL=https://vibeathon60-production.up.railway.app
```

Add to Vercel environment variables:
- `NEXT_PUBLIC_API_URL`: `https://vibeathon60-production.up.railway.app/api/v1`
- `NEXT_PUBLIC_API_MODE`: `live`

### Step 5: Add Environment Variable Validation

Add to `backend/src/index.ts` (before app initialization):

```typescript
// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

console.log('✅ Environment variables validated');
console.log('🌍 Allowed origins:', allowedOrigins);
```

## Implementation Checklist

### Backend Changes (Switch to 'code' mode)
- [ ] Update CORS configuration to accept multiple origins
- [ ] Update Socket.io CORS configuration
- [ ] Add environment variable validation
- [ ] Add logging for CORS requests
- [ ] Test with curl from different origins

### Frontend Changes (Switch to 'code' mode)
- [ ] Create `.env.local` with Railway backend URL
- [ ] Create `.env.development.local` for local development
- [ ] Create `.env.production` for production builds
- [ ] Update `.gitignore` to exclude `.env.local` and `.env.*.local`
- [ ] Test API connection with console logs

### Railway Configuration
- [ ] Add `FRONTEND_URL` environment variable
- [ ] Add `VERCEL_URL` environment variable (if using Vercel)
- [ ] Redeploy backend after environment variable changes
- [ ] Verify deployment logs show correct CORS origins

### Vercel Configuration (if deploying frontend)
- [ ] Add `NEXT_PUBLIC_API_URL` environment variable
- [ ] Add `NEXT_PUBLIC_API_MODE` environment variable
- [ ] Redeploy frontend
- [ ] Test login from deployed frontend

## Testing Strategy

### 1. Local Testing
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev

# Test: Login at http://localhost:3000/auth/login
```

### 2. Railway Backend + Local Frontend
```bash
# Update frontend/.env.local with Railway URL
cd frontend
npm run dev

# Test: Login at http://localhost:3000/auth/login
```

### 3. Railway Backend + Vercel Frontend
```bash
# Deploy frontend to Vercel with environment variables
# Test: Login at https://your-app.vercel.app/auth/login
```

### 4. Verify CORS Headers
```bash
# Test CORS preflight
curl -X OPTIONS https://vibeathon60-production.up.railway.app/api/v1/auth/login \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Should return:
# Access-Control-Allow-Origin: http://localhost:3000
# Access-Control-Allow-Credentials: true
```

## Common Issues and Solutions

### Issue 1: "Network Error" persists
**Solution**: Check browser console for actual error. If it's CORS, verify:
- Backend logs show the request origin
- Origin is in `allowedOrigins` array
- `credentials: true` is set in both frontend and backend

### Issue 2: "Not allowed by CORS"
**Solution**: 
- Add the origin to Railway's `FRONTEND_URL` or `VERCEL_URL`
- Redeploy backend
- Clear browser cache and cookies

### Issue 3: Environment variables not loading
**Solution**:
- Restart Next.js dev server after changing `.env` files
- Verify variable names start with `NEXT_PUBLIC_` for client-side access
- Check Vercel dashboard for correct environment variable configuration

### Issue 4: Works locally but not on Vercel
**Solution**:
- Verify Vercel environment variables are set correctly
- Check Vercel deployment logs for build errors
- Ensure `.env.production` is not in `.gitignore`
- Redeploy after environment variable changes

## Security Considerations

1. **Never commit `.env.local` files** - Add to `.gitignore`
2. **Use specific origins** - Avoid `origin: '*'` in production
3. **Validate environment variables** - Fail fast if critical vars are missing
4. **Use HTTPS in production** - Ensure all URLs use `https://`
5. **Rotate secrets regularly** - Update JWT secrets periodically

## Next Steps

1. **Switch to 'code' mode** to implement backend CORS changes
2. **Create environment files** for frontend configuration
3. **Update Railway environment variables** via dashboard
4. **Test thoroughly** following the testing strategy
5. **Document final configuration** for team reference

## Expected Outcome

After implementing these changes:
- ✅ Frontend can connect to Railway backend from localhost
- ✅ Frontend can connect to Railway backend from Vercel
- ✅ CORS errors are resolved
- ✅ Login and all API calls work correctly
- ✅ Socket.io connections work from all origins
- ✅ Environment-specific configurations are properly isolated
