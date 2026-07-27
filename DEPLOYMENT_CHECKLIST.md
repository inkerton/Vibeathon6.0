# 🚀 Deployment Checklist

Use this checklist to ensure smooth deployment of both backend and frontend.

## Pre-Deployment

### Backend
- [ ] `cd backend && npm install` - Dependencies installed
- [ ] `cd backend && npm run build` - TypeScript compiles without errors
- [ ] `.env` file configured with all required variables
- [ ] Database connection string ready
- [ ] JWT secrets generated (min 32 characters)
- [ ] Email service credentials ready (Mailtrap/SendGrid/Gmail)

### Frontend
- [ ] `cd frontend && npm install` - Dependencies installed
- [ ] `cd frontend && npm run build` - Next.js builds successfully
- [ ] Backend API URL ready for environment variables

---

## Railway Deployment (Backend)

### Setup
- [ ] Create new project on Railway
- [ ] Connect GitHub repository
- [ ] `railway.toml` file exists in project root ✅ (already created)
- [ ] Add PostgreSQL database service
- [ ] Copy `DATABASE_URL` from Railway database

### Environment Variables
Add these in Railway dashboard:
- [ ] `NODE_ENV=production`
- [ ] `PORT=8000`
- [ ] `DATABASE_URL` (auto-set by Railway PostgreSQL)
- [ ] `JWT_SECRET` (generate: `openssl rand -base64 32`)
- [ ] `JWT_REFRESH_SECRET` (generate: `openssl rand -base64 32`)
- [ ] `FRONTEND_URL` (will add after Vercel deployment)
- [ ] `EMAIL_HOST`
- [ ] `EMAIL_PORT`
- [ ] `EMAIL_USER`
- [ ] `EMAIL_PASSWORD`
- [ ] `EMAIL_FROM`
- [ ] `GOOGLE_CLIENT_ID` (optional)
- [ ] `GOOGLE_CLIENT_SECRET` (optional)
- [ ] `GOOGLE_CALLBACK_URL` (optional)

### Deploy
- [ ] Push to GitHub (Railway auto-deploys)
- [ ] Wait for build to complete (~3-5 minutes)
- [ ] Check deployment logs for errors
- [ ] Copy backend URL (e.g., `https://your-app.railway.app`)
- [ ] Test API: `curl https://your-app.railway.app/api/health`

---

## Vercel Deployment (Frontend)

### Setup
- [ ] Create new project on Vercel
- [ ] Import GitHub repository
- [ ] Set Root Directory to `frontend`
- [ ] Framework preset auto-detected as Next.js

### Environment Variables
Add these in Vercel dashboard:
- [ ] `NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api`
- [ ] `NEXT_PUBLIC_SOCKET_URL=https://your-backend.railway.app`

### Deploy
- [ ] Click "Deploy"
- [ ] Wait for build to complete (~2-3 minutes)
- [ ] Check deployment logs for errors
- [ ] Copy frontend URL (e.g., `https://your-app.vercel.app`)

---

## Post-Deployment Configuration

### Update Backend CORS
- [ ] Go to Railway dashboard
- [ ] Update `FRONTEND_URL` environment variable with Vercel URL
- [ ] Redeploy backend (Railway auto-redeploys on env change)

### Test Integration
- [ ] Visit frontend URL
- [ ] Open browser console (F12)
- [ ] Check for API connection errors
- [ ] Try user registration
- [ ] Try user login
- [ ] Test menu browsing
- [ ] Test order placement (if applicable)

---

## Database Setup

### Run Migrations
Option 1: Automatic (via start command in railway.toml)
- [ ] Migrations run automatically on deployment ✅

Option 2: Manual (if needed)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and link project
railway login
railway link

# Run migrations
railway run npx prisma migrate deploy
```

### Seed Database (Optional)
```bash
# Via Railway CLI
railway run npx prisma db seed

# Or add to Railway start command temporarily
```

---

## Verification Steps

### Backend Health Check
- [ ] Visit: `https://your-backend.railway.app/api/health`
- [ ] Should return: `{"status":"ok"}`

### Frontend Health Check
- [ ] Visit: `https://your-app.vercel.app`
- [ ] Page loads without errors
- [ ] No console errors related to API

### API Integration Test
- [ ] Open frontend in browser
- [ ] Open Network tab (F12)
- [ ] Navigate to menu/login page
- [ ] Check API requests are going to correct backend URL
- [ ] Verify responses are successful (200 status)

### Authentication Test
- [ ] Register new user
- [ ] Check email for OTP (if email configured)
- [ ] Verify OTP
- [ ] Login with credentials
- [ ] Check JWT token in localStorage/cookies

---

## Common Issues & Solutions

### Backend Issues

**Build Failed**
- Check TypeScript errors: `cd backend && npm run build`
- Verify all dependencies in package.json
- Check Node version (18.x or higher)

**Database Connection Failed**
- Verify `DATABASE_URL` format
- Check database is running
- Ensure SSL mode: `?sslmode=require` for production

**Migrations Failed**
- Run manually: `railway run npx prisma migrate deploy`
- Check Prisma schema syntax
- Verify database permissions

**CORS Errors**
- Update `FRONTEND_URL` in Railway
- Ensure it matches Vercel URL exactly
- Redeploy backend after change

### Frontend Issues

**Build Failed**
- Check TypeScript errors: `cd frontend && npm run build`
- Verify all dependencies installed
- Check Next.js version compatibility

**API Connection Failed**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend is running
- Test backend URL directly in browser

**Environment Variables Not Working**
- Must be prefixed with `NEXT_PUBLIC_` for client-side
- Redeploy after adding variables
- Clear Vercel build cache if needed

---

## Quick Commands Reference

### Generate Secrets
```bash
# JWT Secret
openssl rand -base64 32

# JWT Refresh Secret
openssl rand -base64 32
```

### Test Backend Locally
```bash
cd backend
npm install
npm run build
npm start
# Visit: http://localhost:8000/api/health
```

### Test Frontend Locally
```bash
cd frontend
npm install
npm run build
npm start
# Visit: http://localhost:3000
```

### Railway CLI Commands
```bash
# Install
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# View logs
railway logs

# Run command
railway run <command>

# Open dashboard
railway open
```

---

## Success Criteria

✅ Backend deployed and accessible
✅ Frontend deployed and accessible
✅ Database connected and migrations applied
✅ API requests working from frontend to backend
✅ User registration/login functional
✅ No CORS errors
✅ No console errors on frontend
✅ All environment variables configured

---

## Deployment Time Estimate

- Railway Backend Setup: ~5 minutes
- Vercel Frontend Setup: ~3 minutes
- Configuration & Testing: ~2 minutes
- **Total: ~10 minutes**

---

## Support Resources

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Prisma Deployment: https://www.prisma.io/docs/guides/deployment
- Next.js Deployment: https://nextjs.org/docs/deployment

---

**Last Updated:** 2026-07-27
**Status:** Ready for deployment ✅
