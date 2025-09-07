import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { 
  Users, 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Coins,
  Activity,
  AlertTriangle,
  Wifi,
  WifiOff,
  Bell
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { apiService } from '../../services/api'
import { Loan } from '../../types'
import { useAdminWebSocket } from '../../hooks/useWebSocket'

const AdminOverview = () => {
  const { user } = useAuthStore()
  const { isConnected, onNewLoan, onAdminNotification } = useAdminWebSocket()
  
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    pendingKyc: 0,
    activeLoans: 0,
    totalVolume: 0,
    pendingLoans: 0,
    totalRevenue: 0
  })

  const [adminNotifications, setAdminNotifications] = useState<Array<{
    id: string
    type: 'loan_request' | 'kyc_submission' | 'system_alert'
    message: string
    timestamp: Date
    isRead: boolean
  }>>([])

  // Set up WebSocket event listeners for admin
  useEffect(() => {
    // Listen for new loan requests
    const cleanupNewLoan = onNewLoan((data) => {
      console.log('New loan request received:', data)
      
      // Update pending loans count
      setAdminStats(prev => ({
        ...prev,
        pendingLoans: prev.pendingLoans + 1
      }))
      
      // Add notification
      setAdminNotifications(prev => [...prev, {
        id: Date.now().toString(),
        type: 'loan_request',
        message: `New loan request: $${data.amount?.toLocaleString()} for ${data.purpose}`,
        timestamp: new Date(),
        isRead: false
      }])
    })

    // Listen for admin notifications
    const cleanupAdminNotifications = onAdminNotification((data) => {
      console.log('Admin notification received:', data)
      
      setAdminNotifications(prev => [...prev, {
        id: Date.now().toString(),
        type: data.type,
        message: data.message,
        timestamp: new Date(),
        isRead: false
      }])
    })

    return () => {
      cleanupNewLoan()
      cleanupAdminNotifications()
    }
  }, [onNewLoan, onAdminNotification])

  const markNotificationAsRead = (notificationId: string) => {
    setAdminNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    )
  }

  const unreadNotificationCount = adminNotifications.filter(n => !n.isRead).length

  // Fetch admin statistics
  useQuery(
    ['admin-dashboard'],
    () => apiService.getMyLoans({ sortBy: 'requestDate', sortOrder: 'desc' }), // Placeholder
    {
      onSuccess: (data) => {
        const loans = data.data?.loans || []
        setAdminStats({
          totalUsers: 125, // Placeholder
          pendingKyc: 8, // Placeholder
          activeLoans: loans.filter((l: Loan) => l.status === 'active').length,
          totalVolume: loans.reduce((sum: number, l: Loan) => sum + l.amount, 0),
          pendingLoans: loans.filter((l: Loan) => l.status === 'pending').length,
          totalRevenue: loans.reduce((sum: number, l: Loan) => sum + l.amount, 0) * 0.05
        })
      },
      onError: (error) => {
        console.error('Failed to fetch admin stats:', error)
      }
    }
  )

  // Fetch recent loans
  const { data: loansResponse, isLoading: loansLoading } = useQuery(
    ['admin-loans-overview'],
    () => apiService.getMyLoans({ sortBy: 'requestDate', sortOrder: 'desc' }),
    {
      select: (response) => response.data?.loans?.slice(0, 5) || []
    }
  )
  const recentLoans = loansResponse || []

  // Placeholder function for future KYC functionality
  // const handleKycApproval = async (userId: string, approve: boolean) => {
  //   try {
  //     console.log(`KYC ${approve ? 'approved' : 'rejected'} for user ${userId}`)
  //     window.location.reload()
  //   } catch (error) {
  //     console.error('KYC action failed:', error)
  //   }
  // }

  const handleLoanApproval = async (loanId: string, approve: boolean) => {
    try {
      if (approve) {
        const walletAddress = prompt('Enter wallet address for loan approval:')
        if (walletAddress) {
          // Placeholder - will need actual approval endpoint
          console.log(`Loan approved for ${loanId} with wallet ${walletAddress}`)
        }
      } else {
        // Placeholder - will need actual rejection endpoint
        console.log(`Loan rejected for ${loanId}`)
      }
      window.location.reload()
    } catch (error) {
      console.error('Loan action failed:', error)
    }
  }

  const handleMintNFT = async (loanId: string) => {
    try {
      const walletAddress = prompt('Enter wallet address for NFT minting:')
      if (walletAddress) {
        // Placeholder - will use Verbwire API
        console.log(`NFT minted for loan ${loanId} to wallet ${walletAddress}`)
        alert('NFT minted successfully!')
        window.location.reload()
      }
    } catch (error) {
      console.error('NFT minting failed:', error)
      alert('Failed to mint NFT')
    }
  }

  const dashboardCards = [
    {
      title: 'Total Users',
      value: adminStats.totalUsers.toString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12%',
      description: 'Registered users'
    },
    {
      title: 'Pending KYC',
      value: adminStats.pendingKyc.toString(),
      icon: Shield,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      change: `${adminStats.pendingKyc} pending`,
      description: 'Awaiting verification'
    },
    {
      title: 'Active Loans',
      value: adminStats.activeLoans.toString(),
      icon: CreditCard,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+8%',
      description: 'Currently active'
    },
    {
      title: 'Total Volume',
      value: `$${adminStats.totalVolume.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+23%',
      description: 'Lifetime lending'
    },
    {
      title: 'Pending Loans',
      value: adminStats.pendingLoans.toString(),
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: `${adminStats.pendingLoans} awaiting`,
      description: 'Need approval'
    },
    {
      title: 'Revenue',
      value: `$${adminStats.totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      change: '+15%',
      description: 'Interest earned'
    }
  ]

  const quickActions = [
    {
      title: 'Review KYC',
      description: 'Approve or reject pending KYC applications',
      icon: Shield,
      link: '/admin/kyc',
      color: 'bg-yellow-500',
      count: adminStats.pendingKyc
    },
    {
      title: 'Loan Approvals',
      description: 'Review and approve loan applications',
      icon: CreditCard,
      link: '/admin/loans',
      color: 'bg-green-500',
      count: adminStats.pendingLoans
    },
    {
      title: 'Marketplace',
      description: 'Monitor NFT-backed loan marketplace',
      icon: Coins,
      link: '/admin/marketplace',
      color: 'bg-purple-500',
      count: adminStats.activeLoans
    },
    {
      title: 'User Management',
      description: 'Manage user accounts and permissions',
      icon: Users,
      link: '/admin/users',
      color: 'bg-blue-500',
      count: adminStats.totalUsers
    }
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Admin Dashboard 👑
          </h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user?.firstName}. Here's your platform overview.
          </p>
        </div>
        
        {/* WebSocket Status & Notifications */}
        <div className="flex items-center space-x-4">
          <div className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
            isConnected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {isConnected ? <Wifi className="w-4 h-4 mr-2" /> : <WifiOff className="w-4 h-4 mr-2" />}
            {isConnected ? 'Live Updates' : 'Offline'}
          </div>
          
          {/* Notification Bell */}
          <div className="relative">
            <button className="p-2 text-gray-600 hover:text-gray-900 relative">
              <Bell className="w-6 h-6" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadNotificationCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Admin Notifications */}
      {adminNotifications.length > 0 && (
        <div className="mb-6 space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Notifications</h3>
          {adminNotifications.slice(-5).reverse().map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                !notification.isRead
                  ? 'bg-blue-50 border-blue-200 text-blue-900'
                  : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}
              onClick={() => markNotificationAsRead(notification.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {notification.type === 'loan_request' && <CreditCard className="w-4 h-4" />}
                  {notification.type === 'kyc_submission' && <Shield className="w-4 h-4" />}
                  {notification.type === 'system_alert' && <AlertTriangle className="w-4 h-4" />}
                  <p className="font-medium">{notification.message}</p>
                  {!notification.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                </div>
                <span className="text-xs opacity-75">
                  {notification.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {dashboardCards.map((card, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-green-600 font-medium">{card.change}</span>
              <p className="text-xs text-gray-500 mt-1">{card.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow hover:border-gray-300"
            >
              <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4 relative`}>
                <action.icon className="h-6 w-6 text-white" />
                {action.count > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                    {action.count}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
              <p className="text-sm text-gray-600">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Loans */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Loan Applications</h2>
            <Link to="/admin/loans" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All
            </Link>
          </div>

          {loansLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : recentLoans.length > 0 ? (
            <div className="space-y-4">
              {recentLoans.map((loan: Loan) => (
                <div key={loan._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(loan.amount)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {loan.purpose} • {loan.termMonths} months
                    </p>
                    <p className="text-xs text-gray-500">
                      Status: <span className="capitalize">{loan.status}</span>
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {loan.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleLoanApproval(loan._id, true)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Approve"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleLoanApproval(loan._id, false)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Reject"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      </>
                    )}
                    <Link
                      to={`/admin/loans`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="View Details"
                    >
                      <Eye className="h-5 w-5" />
                    </Link>
                    {loan.status === 'approved' && !loan.nftTokenId && (
                      <button
                        onClick={() => handleMintNFT(loan._id)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                        title="Mint NFT"
                      >
                        <Coins className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No recent loan applications</p>
            </div>
          )}
        </div>

        {/* Platform Metrics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Platform Metrics</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Loan Approval Rate</span>
              </div>
              <span className="font-semibold text-gray-900">92%</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Average Loan Amount</span>
              </div>
              <span className="font-semibold text-gray-900">
                {formatCurrency(adminStats.totalVolume / Math.max(adminStats.activeLoans, 1))}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                <span className="text-gray-700">NFTs Minted</span>
              </div>
              <span className="font-semibold text-gray-900">{adminStats.activeLoans}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-gray-700">KYC Completion Rate</span>
              </div>
              <span className="font-semibold text-gray-900">87%</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Alerts */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-6 w-6 text-yellow-600 mr-2" />
          <h2 className="text-xl font-bold text-gray-900">System Alerts</h2>
        </div>
        <div className="space-y-3">
          {adminStats.pendingKyc > 0 && (
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-yellow-600 mr-3" />
                <span className="text-yellow-800">
                  {adminStats.pendingKyc} KYC applications require immediate attention
                </span>
              </div>
              <Link
                to="/admin/kyc"
                className="text-yellow-700 hover:text-yellow-900 font-medium text-sm"
              >
                Review →
              </Link>
            </div>
          )}
          
          {adminStats.pendingLoans > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-blue-600 mr-3" />
                <span className="text-blue-800">
                  {adminStats.pendingLoans} loan applications pending approval
                </span>
              </div>
              <Link
                to="/admin/loans"
                className="text-blue-700 hover:text-blue-900 font-medium text-sm"
              >
                Review →
              </Link>
            </div>
          )}
          
          {adminStats.pendingKyc === 0 && adminStats.pendingLoans === 0 && (
            <div className="text-center py-4">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-gray-600">All systems running smoothly! No immediate actions required.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminOverview
