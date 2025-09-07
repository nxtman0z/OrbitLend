import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

// Page imports
import Home from './pages/Home'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/Dashboard'
import LoanRequest from './pages/loans/LoanRequest'
import LoanDetails from './pages/loans/LoanDetails'
import MyLoans from './pages/loans/MyLoans'
import KYCVerification from './pages/kyc/KYCVerification'
import NFTTransfer from './pages/nft/NFTTransfer'
import Profile from './pages/Profile'
import Marketplace from './pages/marketplace/Marketplace'
import NFTDetails from './pages/marketplace/NFTDetails'
import Portfolio from './pages/portfolio/Portfolio'

// Test pages
import WebSocketTest from './pages/test/WebSocketTest'

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminOverview from './pages/admin/AdminOverview'
import AdminLoans from './pages/admin/AdminLoans'
import AdminRequestLoan from './pages/admin/AdminRequestLoan'
import AdminMarketplace from './pages/admin/AdminMarketplace'
import AdminUsers from './pages/admin/AdminUsers'

function App() {
  const { user, isAuthenticated } = useAuthStore()

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />
        
        {/* Auth routes - redirect if already authenticated */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />
            ) : (
              <Layout>
                <Login />
              </Layout>
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />
            ) : (
              <Layout>
                <Register />
              </Layout>
            )
          }
        />

        {/* Protected user routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/kyc"
          element={
            <ProtectedRoute>
              <Layout>
                <KYCVerification />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/nft-transfer"
          element={
            <ProtectedRoute>
              <Layout>
                <NFTTransfer />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/loans/request"
          element={
            <ProtectedRoute>
              <Layout>
                <LoanRequest />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/loans/my-loans"
          element={
            <ProtectedRoute>
              <Layout>
                <MyLoans />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/loans/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <LoanDetails />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/marketplace"
          element={
            <ProtectedRoute>
              <Layout>
                <Marketplace />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/marketplace/nft/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <NFTDetails />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/portfolio"
          element={
            <ProtectedRoute>
              <Layout>
                <Portfolio />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Test routes */}
        <Route
          path="/test/websocket"
          element={
            <ProtectedRoute>
              <Layout>
                <WebSocketTest />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Admin routes with nested structure */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        >
          {/* Nested admin routes */}
          <Route index element={<AdminOverview />} />
          <Route path="loans" element={<AdminLoans />} />
          <Route path="request" element={<AdminRequestLoan />} />
          <Route path="marketplace" element={<AdminMarketplace />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Toast notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  )
}

export default App
