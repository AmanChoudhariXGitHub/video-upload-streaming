# Deployment Guide

## Overview

This application consists of two separate parts that need to be deployed:
1. **Frontend** (Next.js) - Deploy to Vercel
2. **Backend** (Express + Socket.io) - Deploy to Railway/Render/Heroku

## Quick Start: Deploy to Production

### Step 1: Deploy Backend First

The Express backend must be deployed before the frontend. Choose one option:

#### Option A: Railway (Recommended - Easiest)

1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. **Important**: Set Root Directory to `/backend`
5. Railway will auto-detect Node.js and use `npm start`
6. Add environment variables:
   ```
   NODE_ENV=production
   JWT_SECRET=your-super-secret-jwt-key-change-this
   PORT=5000
   ```
7. Copy your Railway URL (e.g., `https://yourapp.railway.app`)

#### Option B: Render

1. Go to [Render.com](https://render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. **Important Settings**:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add environment variables (same as above)
6. Deploy and copy your Render URL

#### Option C: Heroku

1. Install Heroku CLI
2. Create new app: `heroku create your-app-name`
3. Add buildpack: `heroku buildpacks:set heroku/nodejs`
4. Set root: `heroku config:set PROJECT_PATH=backend`
5. Add env vars: `heroku config:set JWT_SECRET=your-secret`
6. Deploy: `git push heroku main`

### Step 2: Deploy Frontend to Vercel

#### Fix Vercel "No Production Deployment" Error

1. **Go to Vercel Dashboard**
   - Open your project settings
   - Navigate to: Settings → General

2. **Configure Build Settings**
   ```
   Framework Preset: Next.js
   Root Directory: ./  (leave as root)
   Build Command: npm run build
   Output Directory: .next (auto-detected)
   Install Command: npm install
   ```

3. **Add Environment Variables**
   - Go to Settings → Environment Variables
   - Add this variable:
     ```
     NEXT_PUBLIC_API_URL = https://your-backend-url.railway.app/api
     ```
   - Replace with your actual backend URL from Step 1

4. **Update vercel.json**
   - Edit `vercel.json` in your repo
   - Update the backend URL in the rewrites section:
     ```json
     "destination": "https://your-actual-backend-url.railway.app/api/:path*"
     ```

5. **Trigger Deployment**
   ```bash
   git add .
   git commit -m "fix: configure vercel deployment"
   git push origin main
   ```

6. **Verify Deployment**
   - Vercel will automatically detect the push
   - Watch the deployment logs
   - Once complete, your production domain will serve traffic

### Step 3: Update Backend CORS

After deploying frontend, update your backend to allow requests:

1. Go to your backend deployment (Railway/Render)
2. Add environment variable:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
3. Redeploy backend

## Common Deployment Issues

### Issue 1: "No Production Deployment" on Vercel

**Cause**: Vercel can't find or build your Next.js app

**Fix**:
- Ensure `package.json` is at root level ✓
- Verify Root Directory is set to `./` (root)
- Check build logs for errors
- Make sure you pushed to `main` branch

### Issue 2: API Calls Failing (CORS errors)

**Cause**: Backend doesn't allow frontend origin

**Fix**:
- Set `FRONTEND_URL` env var on backend
- Restart backend service
- Check backend CORS configuration in `backend/src/server.js`

### Issue 3: Socket.io Not Connecting

**Cause**: WebSocket transport blocked or wrong URL

**Fix**:
- Ensure backend supports WebSockets (Railway/Render do by default)
- Update `NEXT_PUBLIC_API_URL` to use `https://`
- Check browser console for connection errors

### Issue 4: 404 on Video Uploads

**Cause**: File storage path not writable in production

**Fix**:
- Backend needs persistent volume (Railway/Render provide this)
- Or migrate to cloud storage (S3, Cloudinary)
- Check backend logs for write permission errors

## Production Checklist

Before going live:

**Backend**
- [ ] Real MongoDB database connected (not simulated)
- [ ] JWT secret is strong and unique
- [ ] CORS configured with actual frontend URL
- [ ] File storage configured (local with volume or S3)
- [ ] Environment variables set
- [ ] Backend deployed and accessible

**Frontend**
- [ ] NEXT_PUBLIC_API_URL points to production backend
- [ ] Vercel environment variables configured
- [ ] Build succeeds without errors
- [ ] Production domain serving traffic
- [ ] Test login, upload, streaming

**Testing**
- [ ] Create test account and login
- [ ] Upload a test video
- [ ] Verify real-time processing updates work
- [ ] Check admin dashboard access
- [ ] Test video playback
- [ ] Verify analytics tracking

## Monitoring & Maintenance

**Recommended Services**:
- **Logs**: Railway/Render built-in logs, or Papertrail
- **Errors**: Sentry (add `@sentry/node` to backend)
- **Uptime**: UptimeRobot, Pingdom
- **Performance**: Vercel Analytics (included)

**Logs Access**:
- **Railway**: Dashboard → Deployments → View Logs
- **Render**: Dashboard → Logs tab
- **Vercel**: Dashboard → Deployments → Function Logs

## Scaling Considerations

When your app grows:

1. **Database**: Migrate from simulated MongoDB to MongoDB Atlas
2. **File Storage**: Move to S3/Cloudinary for video storage
3. **Video Processing**: Use actual FFmpeg or cloud service (Mux, Cloudflare Stream)
4. **Caching**: Add Redis for session storage and caching
5. **CDN**: Use Cloudflare or AWS CloudFront for video delivery

## Environment Variables Reference

### Backend (.env)
```bash
# Server
NODE_ENV=production
PORT=5000

# Security
JWT_SECRET=your-super-secret-key-min-32-chars

# Frontend (for CORS)
FRONTEND_URL=https://your-app.vercel.app

# Database (when you add real MongoDB)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# Storage (optional - for S3)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_BUCKET_NAME=your-bucket
```

### Frontend (.env.local)
```bash
# Backend API
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
```

## Support

If you encounter issues:

1. Check deployment logs on Railway/Render/Vercel
2. Verify all environment variables are set correctly
3. Test backend API directly with curl/Postman
4. Check browser console for frontend errors
5. Review CORS configuration if getting 403/401 errors

## Local Development

To run locally after cloning:

```bash
# Backend
cd backend
npm install
cp .env.example .env  # Edit with your values
npm run dev

# Frontend (in new terminal)
npm install
npm run dev
```

Visit `http://localhost:3000` for frontend, backend runs on `http://localhost:5000`
