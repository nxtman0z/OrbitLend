# 🚀 OrbitLend Deployment Checklist

## Pre-Deployment Setup

### Backend Preparation
- [ ] Update environment variables
- [ ] Set up MongoDB Atlas database
- [ ] Configure CORS for production
- [ ] Test build process locally (`npm run build`)

### Frontend Preparation  
- [ ] Update API URL environment variable
- [ ] Test production build (`npm run build`)
- [ ] Check all routes work correctly

## Database Setup (MongoDB Atlas)
1. [ ] Create free MongoDB Atlas account
2. [ ] Create new cluster (M0 Sandbox - Free)
3. [ ] Create database user
4. [ ] Whitelist IP addresses (0.0.0.0/0 for all)
5. [ ] Get connection string
6. [ ] Test connection

## Backend Deployment (Railway)
1. [ ] Sign up at railway.app
2. [ ] Connect GitHub account
3. [ ] Create new project from GitHub repo
4. [ ] Select backend folder as root
5. [ ] Add environment variables:
   - [ ] NODE_ENV=production
   - [ ] MONGODB_URI=your-atlas-connection-string
   - [ ] JWT_SECRET=your-secret-key
   - [ ] GEMINI_API_KEY=your-api-key
   - [ ] PORT=5000
6. [ ] Deploy and test endpoints

## Frontend Deployment (Vercel)
1. [ ] Sign up at vercel.com
2. [ ] Import GitHub repository
3. [ ] Configure build settings:
   - [ ] Framework: Vite
   - [ ] Root Directory: frontend
   - [ ] Build Command: npm run build
   - [ ] Output Directory: dist
4. [ ] Add environment variable:
   - [ ] VITE_API_URL=https://your-backend-url.railway.app/api
5. [ ] Deploy and test

## Post-Deployment Testing
- [ ] Test user registration/login
- [ ] Test loan application flow
- [ ] Test admin dashboard
- [ ] Test file uploads
- [ ] Test chatbot functionality
- [ ] Check mobile responsiveness
- [ ] Test all major features

## Optional Enhancements
- [ ] Add custom domain
- [ ] Set up SSL certificate (auto with Vercel/Railway)
- [ ] Configure CDN for static assets
- [ ] Set up monitoring/analytics
- [ ] Configure error tracking (Sentry)

## Environment URLs
- Frontend: https://your-app.vercel.app
- Backend: https://your-backend.railway.app
- Database: MongoDB Atlas cluster

## Troubleshooting
- Check deployment logs in platform dashboards
- Verify environment variables are set correctly
- Test API endpoints individually
- Check CORS configuration for cross-origin requests
