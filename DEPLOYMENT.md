# Deployment Guide

## Production Checklist

Before deploying to production:

- [ ] Replace simulated MongoDB with real database
- [ ] Configure cloud storage (S3, etc.)
- [ ] Set up proper JWT secret
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Add rate limiting
- [ ] Set up monitoring
- [ ] Configure logging
- [ ] Add error tracking (Sentry)
- [ ] Set up backups
- [ ] Configure CDN
- [ ] Add caching layer (Redis)
- [ ] Implement actual video processing

## Vercel Deployment (Frontend)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_API_URL`
4. Deploy

## Backend Deployment Options

### Option 1: Railway
```bash
railway init
railway add
railway up
```

### Option 2: Render
1. Create new Web Service
2. Connect GitHub repository
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && npm start`
5. Add environment variables

### Option 3: AWS EC2
1. Launch EC2 instance
2. Install Node.js
3. Clone repository
4. Install dependencies
5. Use PM2 for process management
6. Configure nginx as reverse proxy

## Environment Variables

Production environment variables:

```env
# Backend
PORT=5000
NODE_ENV=production
JWT_SECRET=<strong-random-secret>
FRONTEND_URL=https://your-frontend.vercel.app
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# Frontend
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
```

## Monitoring

Recommended tools:
- **Logs**: Winston, Papertrail
- **Errors**: Sentry
- **Performance**: New Relic, DataDog
- **Uptime**: UptimeRobot, Pingdom
