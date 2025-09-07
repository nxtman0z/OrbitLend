import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { 
  Bell,
  X,
  User,
  DollarSign,
  Eye,
  AlertTriangle
} from 'lucide-react'
import { apiService } from '../../services/api'
import { toast } from 'react-hot-toast'

interface Notification {
  _id: string
  type: 'loan_request' | 'kyc_submission' | 'system_alert'
  message: string
  data: any
  isRead: boolean
  createdAt: string
}

interface AdminNotificationsProps {
  onLoanRequestClick?: (loanId: string) => void
}

const AdminNotifications = ({ onLoanRequestClick }: AdminNotificationsProps) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const queryClient = useQueryClient()

  // Simulate WebSocket for real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      // Check for new loan requests
      queryClient.invalidateQueries(['admin-notifications'])
    }, 10000) // Check every 10 seconds

    return () => clearInterval(interval)
  }, [queryClient])

  // Fetch notifications
  useQuery(
    ['admin-notifications'],
    () => apiService.getAdminLoanRequests({ 
      page: 1, 
      limit: 5, 
      status: 'pending' 
    }),
    {
      refetchInterval: 10000,
      onSuccess: (data) => {
        const newLoans = data?.data?.loans || []
        
        // Create notifications for new loan requests
        const newNotifications = newLoans.map((loan: any) => ({
          _id: loan._id,
          type: 'loan_request' as const,
          message: `New loan request for $${loan.amount?.toLocaleString()} from ${loan.user?.firstName} ${loan.user?.lastName}`,
          data: loan,
          isRead: false,
          createdAt: loan.requestDate
        }))

        // Check if there are new notifications and show toast
        const existingIds = notifications.map((n: Notification) => n._id)
        const newItems = newNotifications.filter((n: any) => !existingIds.includes(n._id))
        
        if (newItems.length > 0) {
          newItems.forEach((item: any) => {
            toast.success(`🔔 ${item.message}`, {
              duration: 5000
            })
          })
        }

        setNotifications(newNotifications)
      }
    }
  )

  const unreadCount = notifications.filter(n => !n.isRead).length

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n._id === notificationId ? { ...n, isRead: true } : n
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    )
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'loan_request':
        return <DollarSign className="h-5 w-5 text-blue-500" />
      case 'kyc_submission':
        return <User className="h-5 w-5 text-green-500" />
      case 'system_alert':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setShowDropdown(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      markAsRead(notification._id)
                      if (notification.type === 'loan_request' && onLoanRequestClick) {
                        onLoanRequestClick(notification._id)
                        setShowDropdown(false)
                      }
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${
                          !notification.isRead ? 'font-medium text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                          {notification.type === 'loan_request' && (
                            <div className="flex items-center space-x-1">
                              <Eye className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-400">Click to review</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200">
              <button className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  )
}

export default AdminNotifications
