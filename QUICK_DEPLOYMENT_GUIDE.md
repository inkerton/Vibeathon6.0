# Quick Deployment Guide

This guide provides step-by-step instructions to deploy the Restaurant Management System quickly on separate platforms.

## ✅ Pre-Deployment Checklist

Both frontend and backend build successfully:
- ✅ Backend: `npm run build` - No TypeScript errors
- ✅ Frontend: `npm run build` - No TypeScript errors, 22 routes built

---

## 🚀 Backend Deployment (Railway/Render)

### Option A: Railway (Recommended - Fastest)

**Time to Deploy: ~5 minutes**

1. **Prerequisites**
   ```bash
   # Install Railway CLI (optional)
   npm i -g @railway/cli
   ```

2. **Setup Steps**
   - Go to [railway.app](https://railway.app)
   - Click "Start a New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account and select the repository
   - Select the `backend` folder as root directory

3. **Environment Variables**
   Add these in Railway dashboard under "Variables":
   ```env
   NODE_ENV=production
   PORT=8000
   DATABASE_URL=postgresql://user:password@host:port/database
   JWT_SECRET=your-super-secret-jwt-key-min-32-chars
   JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
   FRONTEND_URL=https://your-frontend-url.vercel.app
   
   # Email Configuration (Mailtrap/SendGrid/Gmail)
   EMAIL_HOST=smtp.mailtrap.io
   EMAIL_PORT=587
   EMAIL_USER=your-email-user
   EMAIL_PASSWORD=your-email-password
   EMAIL_FROM=noreply@restaurant.com
   
   # Google OAuth (Optional)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_CALLBACK_URL=https://your-backend-url.railway.app/api/auth/google/callback
   ```

4. **Database Setup**
   - In Railway, click "New" → "Database" → "PostgreSQL"
   - Railway will automatically set `DATABASE_URL`
   - Run migrations:
     ```bash
     # In Railway dashboard, go to Settings → Deploy
     # Add custom start command:
     npm run build && npx prisma migrate deploy && npm start
     ```

5. **Deploy**
   - Railway auto-deploys on git push
   - Get your backend URL: `https://your-app.railway.app`

---

### Option B: Render

**Time to Deploy: ~7 minutes**

1. **Setup Steps**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect GitHub repository
   - Select `backend` as root directory

2. **Configuration**
   ```
   Name: restaurant-backend
   Environment: Node
   Region: Choose closest to users
   Branch: main
   Root Directory: backend
   Build Command: npm install && npm run build && npx prisma generate
   Start Command: npx prisma migrate deploy && npm start
   ```

3. **Environment Variables**
   Same as Railway (see above)

4. **Database**
   - Create PostgreSQL database in Render
   - Copy `DATABASE_URL` to environment variables

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (~5 minutes)

---

## 🌐 Frontend Deployment (Vercel)

### Vercel (Recommended - Fastest)

**Time to Deploy: ~3 minutes**

1. **Prerequisites**
   ```bash
   # Install Vercel CLI (optional)
   npm i -g vercel
   ```

2. **Setup Steps**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Vercel auto-detects Next.js

3. **Configuration**
   ```
   Framework Preset: Next.js
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

4. **Environment Variables**
   Add in Vercel dashboard under "Settings" → "Environment Variables":
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api
   NEXT_PUBLIC_SOCKET_URL=https://your-backend-url.railway.app
   ```

5. **Deploy**
   - Click "Deploy"
   - Vercel builds and deploys automatically
   - Get your URL: `https://your-app.vercel.app`

---

## 🔄 Post-Deployment Steps

### 1. Update Backend CORS & Frontend URL
In Railway/Render, update environment variable:
```env
FRONTEND_URL=https://your-app.vercel.app
```

### 2. Update Frontend API URL
In Vercel, update environment variable:
```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
```

### 3. Database Seeding (Optional)
```bash
# SSH into Railway/Render or use CLI
npx prisma db seed
```

### 4. Test the Deployment
- Visit frontend URL
- Try registration/login
- Check API connectivity
- Test real-time features

---

## 🚀 Alternative Quick Deployment Options

### Frontend Alternatives

**Netlify** (Similar to Vercel)
- Time: ~3 minutes
- Steps: Same as Vercel
- Build command: `npm run build`
- Publish directory: `.next`

**Cloudflare Pages**
- Time: ~4 minutes
- Best for: Global CDN
- Build command: `npm run build`

### Backend Alternatives

**Fly.io**
- Time: ~5 minutes
- Best for: Global deployment
- Requires `fly.toml` configuration

**Heroku**
- Time: ~6 minutes
- Add `Procfile`: `web: npm start`
- Requires credit card (even for free tier)

---

## 📋 Quick Command Reference

### Backend
```bash
# Build
cd backend && npm run build

# Run migrations
npx prisma migrate deploy

# Seed database
npx prisma db seed

# Start production
npm start
```

### Frontend
```bash
# Build
cd frontend && npm run build

# Start production
npm start

# Preview build locally
npm run build && npm start
```

---

## 🔧 Troubleshooting

### Backend Issues

**Database Connection Failed**
- Check `DATABASE_URL` format
- Ensure database is accessible from deployment platform
- Verify SSL mode: `?sslmode=require`

**Migrations Failed**
- Run manually: `npx prisma migrate deploy`
- Check Prisma schema syntax
- Verify database permissions

**CORS Errors**
- Update `FRONTEND_URL` in backend env
- Check CORS configuration in `index.ts`

### Frontend Issues

**API Connection Failed**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend is running
- Test API endpoint directly

**Build Failed**
- Check TypeScript errors: `npm run build`
- Verify all dependencies installed
- Check Node version compatibility

**Environment Variables Not Working**
- Prefix with `NEXT_PUBLIC_` for client-side
- Redeploy after adding variables
- Clear build cache

---

## 📊 Deployment Comparison

| Platform | Backend | Frontend | Time | Free Tier | Best For |
|----------|---------|----------|------|-----------|----------|
| Railway + Vercel | ✅ | ✅ | 8 min | Yes | Fastest setup |
| Render + Vercel | ✅ | ✅ | 10 min | Yes | Reliability |
| Fly.io + Cloudflare | ✅ | ✅ | 12 min | Yes | Global reach |

---

## 🎯 Recommended Stack

**For Hackathon/Demo (Fastest):**
- Backend: Railway
- Frontend: Vercel
- Database: Railway PostgreSQL
- Total Time: ~8 minutes

**For Production:**
- Backend: Render/Railway
- Frontend: Vercel
- Database: Supabase/Neon
- CDN: Cloudflare
- Monitoring: Sentry

---

## 📝 Notes

- All platforms offer free tiers suitable for demos
- Railway: $5 credit/month free
- Vercel: Unlimited deployments for personal projects
- Render: 750 hours/month free
- Always use environment variables for secrets
- Enable HTTPS (automatic on all platforms)
- Set up custom domains after initial deployment

---

## 🔗 Useful Links

- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

**Last Updated:** 2026-07-27
**Build Status:** ✅ Both frontend and backend building successfully
