# Deployment Guide

This guide provides step-by-step instructions for deploying the Video Upload and Streaming Platform.

## Prerequisites

- GitHub repository with the project
- Vercel account (for frontend)
- Render or Railway account (for backend)

## Step 1: Deploy the Backend

### Using Render

1. **Sign in to Render:**
   - Go to https://dashboard.render.com/
   - Sign in with GitHub

2. **Create a new Web Service:**
   - Click "New +" button
   - Select "Web Service"
   - Connect your GitHub repository
   - Select the `video-upload-streaming` repository

3. **Configure the service:**
   - **Name:** `video-upload-api` (or your preferred name)
   - **Region:** Choose closest to your users
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

4. **Add Environment Variables:**
   ```
   PORT=5000
   JWT_SECRET=your-super-secret-jwt-key-change-this
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-url.vercel.app
   ```
   
   **Important:** Replace `FRONTEND_URL` with your actual Vercel URL (you'll get this in Step 2)

5. **Select Plan:**
   - Choose "Free" plan for testing
   - Click "Create Web Service"

6. **Wait for deployment:**
   - First deployment takes 3-5 minutes
   - Note your backend URL (e.g., `https://video-upload-api.onrender.com`)

### Using Railway

1. **Sign in to Railway:**
   - Go to https://railway.app/
   - Sign in with GitHub

2. **Create new project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure service:**
   - Select "backend" as root directory
   - Railway auto-detects Node.js

4. **Add Environment Variables:**
   - Go to Variables tab
   - Add the same variables as Render above

5. **Deploy:**
   - Railway automatically deploys
   - Note your backend URL from Settings → Domains

## Step 2: Deploy the Frontend

### Using Vercel

1. **Sign in to Vercel:**
   - Go to https://vercel.com/
   - Sign in with GitHub

2. **Import Project:**
   - Click "Add New..." → "Project"
   - Select "Import Git Repository"
   - Choose your `video-upload-streaming` repository
   - Click "Import"

3. **Configure Project:**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `frontend` (click "Edit" to change)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

4. **Add Environment Variables:**
   - Click "Environment Variables"
   - Add: `NEXT_PUBLIC_API_URL`
   - Value: Your backend URL (e.g., `https://video-upload-api.onrender.com`)
   - Click "Add"

5. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes for build
   - Note your frontend URL (e.g., `https://video-upload-streaming.vercel.app`)

## Step 3: Update Backend with Frontend URL

1. **Go back to your backend service** (Render or Railway)
2. **Update Environment Variables:**
   - Find `FRONTEND_URL` variable
   - Update with your Vercel URL
   - Save changes
3. **Restart the service** if needed

## Step 4: Verify Deployment

### Test Backend

1. **Health Check:**
   ```bash
   curl https://your-backend-url.onrender.com/health
   ```
   Should return: `{"status":"ok"}`

2. **Test Login:**
   ```bash
   curl -X POST https://your-backend-url.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"admin123"}'
   ```
   Should return a JWT token

### Test Frontend

1. **Open your frontend URL** in browser
2. **Login with demo account:**
   - Email: `admin@example.com`
   - Password: `admin123`
3. **Try uploading a video:**
   - Should see real-time progress
   - Check processing updates
4. **Verify streaming:**
   - Click on uploaded video
   - Should play without errors

## Common Issues

### Issue: Vercel build fails

**Solution:**
- Check Build Logs in Vercel dashboard
- Verify `frontend` root directory is set correctly
- Ensure all dependencies are in `frontend/package.json`
- Check for TypeScript errors

### Issue: Backend connection refused

**Solution:**
- Verify backend is running (check Render/Railway logs)
- Check `NEXT_PUBLIC_API_URL` in Vercel environment variables
- Ensure URL doesn't have trailing slash
- Wait for backend "cold start" (Render free tier)

### Issue: CORS errors

**Solution:**
- Verify `FRONTEND_URL` is set correctly in backend
- Check CORS configuration in `backend/src/server.js`
- Ensure protocol (http/https) matches

### Issue: Socket.io not connecting

**Solution:**
- Check browser console for errors
- Verify backend URL in `frontend/lib/socket-client.ts`
- Ensure backend is publicly accessible
- Check WebSocket support on hosting platform

### Issue: File upload fails

**Solution:**
- Check backend logs for errors
- Verify storage directory permissions
- Ensure backend has enough disk space
- Check file size limits (default: 500MB)

## Monitoring

### Backend Logs
- **Render:** Go to service → Logs tab
- **Railway:** Go to project → Deployments → View logs

### Frontend Logs
- **Vercel:** Go to project → Deployments → Click deployment → View Function Logs

### Analytics
- Monitor video uploads, processing times, and errors
- Use admin dashboard for platform statistics

## Security Recommendations

1. **Change JWT Secret:**
   - Use a strong, random secret in production
   - Never commit secrets to Git

2. **Enable Rate Limiting:**
   - Uncomment rate limiter in `backend/src/server.js`
   - Adjust limits based on your needs

3. **Add File Validation:**
   - Implement virus scanning for uploads
   - Validate file types strictly

4. **Use HTTPS:**
   - Both Render and Vercel provide SSL by default
   - Ensure all URLs use `https://`

5. **Monitor Logs:**
   - Regularly check for suspicious activity
   - Set up error alerts

## Scaling Considerations

### Backend
- **Free Tier Limitations:**
  - Render: Spins down after inactivity
  - Railway: 500 hours/month

- **Upgrade Options:**
  - Paid plans start at $7/month (Render)
  - Better performance and no sleep

### Storage
- Current implementation uses local filesystem
- For production, consider:
  - AWS S3
  - Cloudflare R2
  - Vercel Blob

### Database
- Current implementation uses in-memory storage
- For production, use real MongoDB:
  - MongoDB Atlas (free tier available)
  - Update `backend/src/config/db.js`

## Next Steps

1. **Custom Domain:**
   - Add custom domain in Vercel
   - Update environment variables

2. **Real Database:**
   - Set up MongoDB Atlas
   - Migrate from simulated storage

3. **Real Video Processing:**
   - Integrate FFmpeg
   - Set up background job queue

4. **CDN:**
   - Add Cloudflare for video delivery
   - Improve streaming performance

## Support

If you encounter issues not covered here:
1. Check the logs for error messages
2. Review the README.md for API documentation
3. Open a GitHub issue with details
