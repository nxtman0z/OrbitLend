# Render Deployment Configuration

## Backend Web Service Settings:
- **Service Type:** Web Service
- **Root Directory:** backend
- **Runtime:** Node
- **Build Command:** npm install && npm run build
- **Start Command:** npm start
- **Port:** 10000 (automatic)

## Frontend Static Site Settings:
- **Service Type:** Static Site  
- **Root Directory:** frontend
- **Build Command:** npm install && npm run build
- **Publish Directory:** dist

## Environment Variables for Backend:
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/orbitlend
JWT_SECRET=your-super-secret-jwt-key-here
GEMINI_API_KEY=your-gemini-api-key-here
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

## Environment Variables for Frontend:
VITE_API_URL=https://your-backend-name.onrender.com/api

## Steps:
1. Deploy backend first
2. Note the backend URL (https://your-backend-name.onrender.com)
3. Deploy frontend with the backend URL in VITE_API_URL
4. Test the complete application
