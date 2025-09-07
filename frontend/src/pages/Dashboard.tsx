import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  CreditCard, 
  Wallet, 
  TrendingUp, 
  Shield, 
  Send,
  Plus,
  Eye,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  Target,
  Wifi,
  WifiOff,
  LogOut,
  User,
  Settings
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useLoanWebSocket } from '../hooks/useWebSocket'
import { toast } from 'react-hot-toast'
import Chatbot from '../components/Chatbot'

interface DashboardStats {
  totalLoans: number
  activeLoans: number
  completedLoans: number
  totalBorrowed: number
  totalRepaid: number
  pendingAmount: number
  portfolioValue: number
  nftLoans: number
  kycStatus: 'pending' | 'approved' | 'rejected'
}

interface RecentTransaction {
  id: string
  type: 'loan_disbursement' | 'repayment' | 'nft_transfer' | 'investment'
  amount: number
  status: 'completed' | 'pending' | 'failed'
  date: string
  description: string
}

const Dashboard = () => {
  const { user, logout } = useAuthStore()
  const { isConnected, onLoanStatus, onLoanFunded, onKYCStatus } = useLoanWebSocket()
  const navigate = useNavigate()
  
  const [stats, setStats] = useState<DashboardStats>({
    totalLoans: 3,
    activeLoans: 2,
    completedLoans: 1,
    totalBorrowed: 15000,
    totalRepaid: 5000,
    pendingAmount: 10000,
    portfolioValue: 25000,
    nftLoans: 1,
    kycStatus: 'pending'
  })

  const [notifications, setNotifications] = useState<Array<{
    id: string
    message: string
    type: 'success' | 'error' | 'info'
    timestamp: Date
  }>>([])

  // Set up WebSocket event listeners
  useEffect(() => {
    // Listen for loan status updates
    const cleanupLoanStatus = onLoanStatus((data) => {
      console.log('Loan status update received:', data)
      
      // Update stats based on loan status
      if (data.status === 'approved') {
        setStats(prev => ({
          ...prev,
          activeLoans: prev.activeLoans + 1
        }))
      }
      
      // Add notification
      setNotifications(prev => [...prev, {
        id: Date.now().toString(),
        message: `Loan ${data.status}: ${data.status === 'approved' 
          ? `$${data.amount?.toLocaleString()} approved!` 
          : data.rejectionReason || 'Please contact support'}`,
        type: data.status === 'approved' ? 'success' : 'error',
        timestamp: new Date()
      }])
    })

    // Listen for loan funding updates
    const cleanupLoanFunded = onLoanFunded((data) => {
      console.log('Loan funded update received:', data)
      
      setStats(prev => ({
        ...prev,
        portfolioValue: prev.portfolioValue + data.amount,
        nftLoans: prev.nftLoans + 1
      }))
      
      setNotifications(prev => [...prev, {
        id: Date.now().toString(),
        message: `Loan funded! $${data.amount?.toLocaleString()} transferred. NFT #${data.nftId} minted.`,
        type: 'success',
        timestamp: new Date()
      }])
    })

    // Listen for KYC status updates
    const cleanupKYCStatus = onKYCStatus((data) => {
      console.log('KYC status update received:', data)
      
      setStats(prev => ({
        ...prev,
        kycStatus: data.status
      }))
      
      setNotifications(prev => [...prev, {
        id: Date.now().toString(),
        message: `KYC ${data.status}: ${data.status === 'approved' 
          ? 'You can now apply for loans!' 
          : data.rejectionReason || 'Please resubmit your documents'}`,
        type: data.status === 'approved' ? 'success' : 'error',
        timestamp: new Date()
      }])
    })

    // Cleanup functions
    return () => {
      cleanupLoanStatus()
      cleanupLoanFunded()
      cleanupKYCStatus()
    }
  }, [onLoanStatus, onLoanFunded, onKYCStatus])

  // Mock recent transactions (replace with real API call)
  const recentTransactions: RecentTransaction[] = [
    {
      id: '1',
      type: 'loan_disbursement',
      amount: 5000,
      status: 'completed',
      date: '2025-09-06',
      description: 'Personal Loan Disbursement'
    },
    {
      id: '2',
      type: 'repayment',
      amount: 1200,
      status: 'completed',
      date: '2025-09-05',
      description: 'Monthly Repayment - Loan #12345'
    },
    {
      id: '3',
      type: 'nft_transfer',
      amount: 0,
      status: 'pending',
      date: '2025-09-04',
      description: 'NFT Loan Token Transfer'
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'rejected':
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  const getKYCStatusBadge = () => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending Review' },
      approved: { color: 'bg-green-100 text-green-800', text: 'Verified' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rejected' }
    }
    
    const config = statusConfig[stats.kycStatus] || statusConfig.pending
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {getStatusIcon(stats.kycStatus)}
        <span className="ml-1">{config.text}</span>
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.firstName || 'User'}!
            </h1>
            <p className="text-gray-600 mt-1">
              Here's your OrbitLend dashboard overview
            </p>
          </div>
          
          {/* Right side actions and status */}
          <div className="flex items-center space-x-4">
            {/* Wallet User Quick Actions */}
            {user?.isWalletUser && (
              <div className="flex items-center space-x-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl px-4 py-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">
                    {user?.walletAddress?.slice(0, 6)}...{user?.walletAddress?.slice(-4)}
                  </span>
                </div>
                <div className="h-4 w-px bg-gray-300"></div>
                <button
                  onClick={() => {
                    logout()
                    toast.success('Wallet disconnected successfully')
                    navigate('/login')
                  }}
                  className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 transition-colors"
                  title="Disconnect Wallet"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Disconnect</span>
                </button>
              </div>
            )}
            
            {/* WebSocket Connection Status */}
            <div className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
              isConnected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {isConnected ? <Wifi className="w-4 h-4 mr-2" /> : <WifiOff className="w-4 h-4 mr-2" />}
              {isConnected ? 'Live Updates' : 'Offline'}
            </div>
          </div>
        </div>

        {/* Real-time Notifications */}
        {notifications.length > 0 && (
          <div className="mb-6 space-y-2">
            {notifications.slice(-3).map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${
                  notification.type === 'success' 
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : notification.type === 'error'
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium">{notification.message}</p>
                  <span className="text-xs opacity-75">
                    {notification.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* KYC Status Alert */}
        {stats.kycStatus !== 'approved' && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Shield className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-blue-800 font-medium">KYC Verification Required</span>
              {getKYCStatusBadge()}
            </div>
            <p className="text-blue-700 mt-1 text-sm">
              Complete your KYC verification to access all features and higher loan limits.
            </p>
            <Link
              to="/kyc"
              className="inline-flex items-center mt-2 text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Complete KYC Verification
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Portfolio Value */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Wallet className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Portfolio Value</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${stats.portfolioValue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Active Loans */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CreditCard className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Loans</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeLoans}</p>
                <p className="text-sm text-gray-600">of {stats.totalLoans} total</p>
              </div>
            </div>
          </div>

          {/* Total Borrowed */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Borrowed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${stats.totalBorrowed.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* NFT Loans */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">NFT Loans</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.nftLoans}</p>
                <p className="text-sm text-gray-600">tokenized</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Quick Actions & Loan Status */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link
                  to="/loans/request"
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <Plus className="w-8 h-8 text-blue-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Request Loan</span>
                </Link>
                
                <Link
                  to="/loans/my-loans"
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
                >
                  <Eye className="w-8 h-8 text-green-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">My Loans</span>
                </Link>
                
                <Link
                  to="/marketplace"
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                >
                  <BarChart3 className="w-8 h-8 text-purple-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Marketplace</span>
                </Link>
                
                <Link
                  to="/profile"
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
                >
                  <Settings className="w-8 h-8 text-orange-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Profile Settings</span>
                </Link>
              </div>
              
              {/* Secondary Quick Actions */}
              <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mt-4">
                <Link
                  to="/portfolio"
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                >
                  <TrendingUp className="w-8 h-8 text-indigo-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Portfolio</span>
                </Link>
                
                <Link
                  to="/kyc"
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-yellow-300 hover:bg-yellow-50 transition-colors"
                >
                  <Shield className="w-8 h-8 text-yellow-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">KYC Verification</span>
                </Link>
              </div>
            </div>

            {/* Recent Loans */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Loans</h2>
                <Link
                  to="/loans/my-loans"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  View all
                </Link>
              </div>
              
              <div className="text-center py-6">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No loans yet</p>
                <Link
                  to="/loans/request"
                  className="inline-flex items-center mt-2 text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Request your first loan
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Recent Transactions */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
                <Link
                  to="/transactions"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  View all
                </Link>
              </div>
              
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 mr-3">
                        {transaction.type === 'loan_disbursement' && <ArrowDownRight className="w-5 h-5 text-green-500" />}
                        {transaction.type === 'repayment' && <ArrowUpRight className="w-5 h-5 text-blue-500" />}
                        {transaction.type === 'nft_transfer' && <Send className="w-5 h-5 text-purple-500" />}
                        {transaction.type === 'investment' && <TrendingUp className="w-5 h-5 text-indigo-500" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.amount > 0 ? `$${transaction.amount.toLocaleString()}` : 'NFT'}
                        </p>
                        <p className="text-xs text-gray-500 truncate max-w-32">
                          {transaction.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusIcon(transaction.status)}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Repayment Rate</span>
                  <span className="text-sm font-medium text-green-600">98.5%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Credit Score</span>
                  <span className="text-sm font-medium text-blue-600">750</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Returns</span>
                  <span className="text-sm font-medium text-purple-600">
                    ${stats.totalRepaid.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chatbot Widget */}
      <Chatbot />
    </div>
  )
}

export default Dashboard