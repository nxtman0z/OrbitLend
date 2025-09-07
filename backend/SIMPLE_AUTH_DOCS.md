# OrbitLend Simple Authentication System

## Overview
A simplified MongoDB-based authentication system for OrbitLend that stores and validates users directly from the database without JWT tokens.

## Features
- ✅ User signup with bcrypt password hashing
- ✅ Admin signup with role-based access
- ✅ MongoDB direct authentication (no JWT)
- ✅ Secure password validation with bcrypt
- ✅ Complete error handling
- ✅ TypeScript support

## API Endpoints

### Base URL: `http://localhost:5001/api/simple-auth`

### 1. User/Admin Signup
**POST** `/signup`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com", 
  "password": "password123",
  "role": "user"  // "user" or "admin"
}
```

**Success Response (201):**
```json
{
  "message": "Signup successful",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "createdAt": "2025-09-06T20:40:52.222Z"
  }
}
```

**Error Responses:**
- `400`: Missing required fields
- `400`: Email already exists
- `400`: Invalid role

### 2. User/Admin Login
**POST** `/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "role": "user",
  "user": {
    "id": "...",
    "name": "John Doe", 
    "email": "john@example.com",
    "role": "user",
    "createdAt": "2025-09-06T20:40:52.222Z",
    "updatedAt": "2025-09-06T20:40:52.222Z"
  }
}
```

**Error Responses:**
- `400`: Missing email or password
- `401`: Invalid credentials

### 3. Get All Users (Testing)
**GET** `/users`

**Success Response (200):**
```json
{
  "message": "Users retrieved successfully",
  "users": [...] // Array of users without passwords
}
```

## Database Schema

### Collection: `simpleusers`
```javascript
{
  name: String,        // Required
  email: String,       // Required, unique, lowercase
  password: String,    // Required, bcrypt hashed
  role: String,        // "user" | "admin", default: "user"
  createdAt: Date,     // Auto-generated
  updatedAt: Date      // Auto-generated
}
```

## Security Features

1. **Password Hashing**: bcrypt with salt rounds 12
2. **Email Validation**: Lowercase, unique constraint
3. **Role Validation**: Only "user" or "admin" allowed
4. **Password Exclusion**: Passwords never returned in responses
5. **Input Validation**: Required field checking

## Example Usage

### Create a User Account
```bash
curl -X POST http://localhost:5001/api/simple-auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123","role":"user"}'
```

### Create an Admin Account  
```bash
curl -X POST http://localhost:5001/api/simple-auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Admin","email":"jane@example.com","password":"admin123","role":"admin"}'
```

### Login as User
```bash
curl -X POST http://localhost:5001/api/simple-auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

### Login as Admin
```bash
curl -X POST http://localhost:5001/api/simple-auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"admin123"}'
```

## Environment Variables
```properties
MONGODB_URI=mongodb://localhost:27017/orbitlend
PORT=5001
NODE_ENV=development
```

## Testing
Run the included test script:
```bash
cd backend
chmod +x test-simple-auth.sh
./test-simple-auth.sh
```

## File Structure
```
backend/
├── src/
│   ├── models/
│   │   └── SimpleUser.ts        # User schema and model
│   ├── routes/
│   │   └── simpleAuth.ts        # Authentication routes
│   └── index.ts                 # Main server file (updated)
├── test-simple-auth.sh          # Test script
└── .env                         # Environment variables
```

## Key Differences from JWT System
- ❌ No JWT tokens
- ❌ No token expiration
- ❌ No token refresh
- ✅ Direct MongoDB validation
- ✅ Simpler authentication flow
- ✅ Password-only security model
- ✅ Role-based responses

## Production Considerations
1. Add session management for stateful authentication
2. Implement rate limiting on auth endpoints
3. Add password strength requirements
4. Consider adding email verification
5. Implement account lockout after failed attempts
6. Add audit logging for authentication events

---
**Status**: ✅ Fully implemented and tested
**Last Updated**: September 6, 2025
