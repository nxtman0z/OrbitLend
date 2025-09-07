#!/bin/bash

echo "🚀 Testing OrbitLend Simple Auth System"
echo "======================================="
echo ""

BASE_URL="http://localhost:5001/api/simple-auth"

echo "1. Testing User Signup..."
curl -X POST $BASE_URL/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"testuser@demo.com","password":"password123","role":"user"}' \
  -w "\n\n"

echo "2. Testing Admin Signup..."
curl -X POST $BASE_URL/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Admin","email":"testadmin@demo.com","password":"password123","role":"admin"}' \
  -w "\n\n"

echo "3. Testing User Login..."
curl -X POST $BASE_URL/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@demo.com","password":"password123"}' \
  -w "\n\n"

echo "4. Testing Admin Login..."
curl -X POST $BASE_URL/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testadmin@demo.com","password":"password123"}' \
  -w "\n\n"

echo "5. Testing Invalid Login..."
curl -X POST $BASE_URL/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@demo.com","password":"wrongpassword"}' \
  -w "\n\n"

echo "6. Getting All Users..."
curl -X GET $BASE_URL/users -w "\n\n"

echo "✅ All tests completed!"
