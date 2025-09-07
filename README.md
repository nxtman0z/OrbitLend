# OrbitLend - Fintech Blockchain Platform

OrbitLend is a comprehensive fintech blockchain platform that enables users to request loans, tokenize loans as NFTs, and trade them on a marketplace. The platform integrates with Verbwire API for NFT operations and uses MongoDB for data persistence.

## 🚀 Features

- **User Authentication & KYC**: Secure JWT-based authentication with role-based access control (User/Admin)
- **Loan Management**: Request, approve, and manage loans with automated repayment schedules
- **NFT Tokenization**: Convert loans into NFTs using Verbwire API on Ethereum Sepolia testnet
- **NFT Marketplace**: Trade loan NFTs with other users
- **Admin Dashboard**: Comprehensive admin interface for user and loan management
- **Real-time Updates**: Live status updates for loans and NFT transactions

## 🛠 Tech Stack

### Backend
- **Node.js** with **Express.js**
- **TypeScript** for type safety
- **MongoDB** with **Mongoose** ODM
- **JWT** authentication with **bcrypt** password hashing
- **Verbwire API** for blockchain NFT operations
- **Express Rate Limiting** and **Helmet** for security

### Frontend
- **React 18** with **TypeScript**
- **Vite** for fast development and building
- **TailwindCSS** for styling
- **React Router** for navigation
- **React Query** for API state management
- **Zustand** for global state management
- **React Hook Form** with **Zod** validation
- **React Hot Toast** for notifications

### Blockchain Integration
- **Ethereum Sepolia Testnet**
- **Verbwire API** for NFT minting and transfers
- **ERC-721** standard for loan NFTs

## 📁 Project Structure

```
OrbitLend/
├── backend/
│   ├── src/
│   │   ├── config/         # Database and app configuration
│   │   ├── middleware/     # Authentication, error handling, validation
│   │   ├── models/         # MongoDB schemas (User, Loan, NFTLoan)
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic and external API integrations
│   │   └── index.ts        # Application entry point
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   ├── stores/         # Zustand state stores
│   │   ├── types/          # TypeScript type definitions
│   │   └── App.tsx         # Main application component
│   ├── package.json
│   └── .env
├── contracts/              # Smart contracts (future development)
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **Git**
- **Verbwire API Account** (for blockchain operations)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd OrbitLend
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```
   
   Create `.env` file:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/orbitlend
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   
   # Verbwire API (Get from https://verbwire.com)
   VERBWIRE_PRIVATE_KEY=your-verbwire-private-key
   VERBWIRE_PUBLIC_KEY=your-verbwire-public-key
   VERBWIRE_BASE_URL=https://api.verbwire.com/v1
   VERBWIRE_CHAIN_NAME=sepolia
   
   # Server
   PORT=5001
   NODE_ENV=development
   
   # File Upload
   MAX_FILE_SIZE=5242880
   UPLOAD_PATH=./uploads
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```
   
   Create `.env` file:
   ```env
   VITE_API_URL=http://localhost:5001/api
   ```

4. **Start MongoDB**
   ```bash
   # If using Homebrew on macOS
   brew services start mongodb/brew/mongodb-community
   
   # Or start manually
   mongod
   ```

5. **Run the Application**
   
   Start the backend (from backend directory):
   ```bash
   npm run dev
   ```
   
   Start the frontend (from frontend directory):
   ```bash
   npm run dev
   ```

### Access Points
- **Frontend**: http://localhost:5173 (Vite development server)
- **Backend API**: http://localhost:5001/api
- **MongoDB**: mongodb://localhost:27017/orbitlend

## 🔧 Current Status

### ✅ **All Major Issues Fixed:**
1. **CSS Build Errors**: Fixed Tailwind CSS configuration issues with custom CSS variables
2. **TypeScript Compilation**: All TypeScript errors resolved
3. **Environment Configuration**: Backend and frontend properly configured
4. **API Integration**: Verbwire and Pinata services integrated
5. **Database Connection**: MongoDB successfully connected
6. **Development Servers**: Both frontend and backend running without errors

### 🚀 **Running Servers:**
- ✅ Backend: http://localhost:5001 (Node.js + Express + TypeScript)
- ✅ Frontend: http://localhost:5173 (React + Vite + TypeScript)
- ✅ Database: MongoDB running locally
- ✅ Build: Frontend builds successfully for production

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

### User Endpoints
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/kyc` - Submit KYC verification

### Loan Endpoints
- `GET /api/loans` - Get user's loans
- `POST /api/loans` - Create loan request
- `GET /api/loans/:id` - Get loan details
- `PUT /api/loans/:id/repay` - Make loan repayment

### NFT Endpoints
- `POST /api/nfts/mint` - Mint loan as NFT
- `GET /api/nfts` - Get user's NFTs
- `POST /api/nfts/transfer` - Transfer NFT
- `GET /api/nfts/marketplace` - Get marketplace listings

### Admin Endpoints
- `GET /api/admin/users` - Get all users
- `GET /api/admin/loans` - Get all loans
- `PUT /api/admin/loans/:id/approve` - Approve/reject loan

## 🔐 Security Features

- **JWT Authentication** with secure token storage
- **Password Hashing** using bcrypt
- **Rate Limiting** to prevent API abuse
- **Input Validation** with express-validator
- **CORS Configuration** for cross-origin requests
- **Helmet.js** for security headers
- **Role-based Access Control** (User/Admin)

## 🌐 Blockchain Integration

The platform integrates with Ethereum blockchain through Verbwire API:

- **NFT Minting**: Convert approved loans into ERC-721 NFTs
- **NFT Transfers**: Transfer ownership between users
- **Metadata Storage**: Store loan details as NFT metadata
- **Marketplace Operations**: List and trade NFTs

## 🎨 Frontend Features

- **Responsive Design** with TailwindCSS
- **Dark/Light Mode** support
- **Real-time Notifications** with React Hot Toast
- **Form Validation** with React Hook Form and Zod
- **Protected Routes** for authenticated users
- **Admin Dashboard** with comprehensive controls
- **NFT Gallery** for viewing tokenized loans

## 🧪 Development

### Backend Commands
```bash
npm run dev          # Start development server
npm run build        # Build TypeScript
npm run start        # Start production server
npm run test         # Run tests
```

### Frontend Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 📝 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb://localhost:27017/orbitlend
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d
VERBWIRE_PRIVATE_KEY=your-verbwire-private-key
VERBWIRE_PUBLIC_KEY=your-verbwire-public-key
VERBWIRE_BASE_URL=https://api.verbwire.com/v1
VERBWIRE_CHAIN_NAME=sepolia
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5001/api
```

## 🚀 Deployment

### Backend Deployment
1. Build the TypeScript code: `npm run build`
2. Set production environment variables
3. Deploy to your preferred hosting platform (AWS, Heroku, DigitalOcean)

### Frontend Deployment
1. Build the React app: `npm run build`
2. Deploy the `dist` folder to a static hosting service (Vercel, Netlify, AWS S3)

### Database
- Use MongoDB Atlas for production database
- Update MONGODB_URI in production environment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and commit: `git commit -m 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation in the `/docs` folder

## 🚀 Future Enhancements

- **Smart Contracts**: Direct blockchain integration
- **DeFi Integration**: Liquidity pools and yield farming
- **Mobile App**: React Native mobile application
- **Advanced Analytics**: Loan performance metrics
- **Multi-chain Support**: Support for multiple blockchain networks
- **Automated Underwriting**: AI-powered loan approval system

---

**OrbitLend** - Revolutionizing fintech through blockchain technology! 🚀
...........
