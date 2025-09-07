#!/bin/bash

# OrbitLend Startup Script
echo "🚀 Starting OrbitLend Application..."

# Check if MongoDB is running
if ! pgrep -f mongod > /dev/null; then
    echo "❌ MongoDB is not running. Please start MongoDB first."
    echo "Run: brew services start mongodb/brew/mongodb-community"
    exit 1
fi

echo "✅ MongoDB is running"

# Kill any existing processes on our ports
echo "🧹 Cleaning up existing processes..."
lsof -ti:3000,5001 | xargs kill -9 2>/dev/null || true

# Wait a moment for processes to clean up
sleep 2

# Start backend
echo "🔧 Starting Backend Server..."
cd backend
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 5

# Start frontend
echo "🎨 Starting Frontend Server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
echo "⏳ Waiting for frontend to initialize..."
sleep 3

echo ""
echo "🎉 OrbitLend Application Started Successfully!"
echo ""
echo "📊 Backend API: http://localhost:5001"
echo "🌐 Frontend App: http://localhost:3000"
echo ""
echo "📋 Available Routes:"
echo "   • Home: http://localhost:3000/"
echo "   • Register: http://localhost:3000/register"
echo "   • Login: http://localhost:3000/login"
echo "   • Dashboard: http://localhost:3000/dashboard"
echo "   • Admin: http://localhost:3000/admin"
echo ""
echo "🛑 To stop the servers, press Ctrl+C or run:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""

# Keep the script running
wait
