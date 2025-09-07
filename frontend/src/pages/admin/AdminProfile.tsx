import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  Edit3, 
  Save, 
  X,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  LogOut,
  BarChart3,
  Settings as SettingsIcon,
  Shield,
  Database
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { toast } from 'react-hot-toast'
import ProfileImage from '../../components/profile/ProfileImage'
import PasswordChange from '../../components/profile/PasswordChange'
import { WalletConnection } from '../../components/profile/WalletConnection'
import AccountSettings from '../../components/profile/AccountSettings'

interface AdminStats {
  loansApproved: number
  loansRejected: number
  kycVerified: number
  kycRejected: number
  totalUsers: number
  totalLoanAmount: number
  systemHealth: 'good' | 'warning' | 'critical'
}

interface Address {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

interface SystemSettings {
  interestRates: {
    min: number
    max: number
    default: number
  }
  loanLimits: {
    min: number
    max: number
  }
  kycRequirements: {
    autoApproval: boolean
    documentExpiry: number
  }
  systemMaintenance: {
    enabled: boolean
    message: string
  }
}

const AdminProfile = () => {
  const { user, updateUser, logout } = useAuthStore()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editedUser, setEditedUser] = useState(user)
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null)
  const [activeTab, setActiveTab] = useState<'basic' | 'password' | 'wallet' | 'settings' | 'system'>('basic')

  // Helper function to get address object
  const getAddressObject = (address: any): Address => {
    if (typeof address === 'object' && address !== null) {
      return {
        street: address.street || '',
        city: address.city || '',
        state: address.state || '',
        zipCode: address.zipCode || '',
        country: address.country || ''
      }
    }
    return {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  }

  // Helper function to update address
  const updateAddress = (field: keyof Address, value: string) => {
    if (!editedUser) return
    const currentAddress = getAddressObject(editedUser.address)
    setEditedUser({
      ...editedUser,
      address: {
        ...currentAddress,
        [field]: value
      }
    })
  }

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    interestRates: {
      min: 3.5,
      max: 15.0,
      default: 8.0
    },
    loanLimits: {
      min: 1000,
      max: 1000000
    },
    kycRequirements: {
      autoApproval: false,
      documentExpiry: 365
    },
    systemMaintenance: {
      enabled: false,
      message: ''
    }
  })

  // Default settings
  const [accountSettings, setAccountSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false,
      loanUpdates: true,
      marketingEmails: false
    },
    security: {
      twoFactorAuth: true, // Admins should have 2FA enabled by default
      loginAlerts: true,
      sessionTimeout: 30 // Shorter session for admins
    },
    preferences: {
      theme: 'light' as 'light' | 'dark' | 'system',
      language: 'en',
      currency: 'USD',
      timezone: 'UTC'
    }
  })

  useEffect(() => {
    if (user) {
      setEditedUser(user)
      fetchAdminStats()
      fetchSystemSettings()
    }
  }, [user])

  const fetchAdminStats = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/admin/comprehensive-stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const stats = await response.json()
        setAdminStats(stats)
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error)
    }
  }

  const fetchSystemSettings = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/admin/system-settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const settings = await response.json()
        setSystemSettings(settings)
      }
    } catch (error) {
      console.error('Error fetching system settings:', error)
    }
  }

  const handleSave = async () => {
    if (!editedUser) return

    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:5001/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          firstName: editedUser.firstName,
          lastName: editedUser.lastName,
          phone: editedUser.phone,
          address: editedUser.address
        })
      })

      if (response.ok) {
        const updatedUser = await response.json()
        updateUser(updatedUser)
        setIsEditing(false)
        toast.success('Profile updated successfully!')
      } else {
        toast.error('Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpdate = async (file: File) => {
    try {
      setIsLoading(true)
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }

      const formData = new FormData()
      formData.append('profilePicture', file)
      
      const response = await fetch('http://localhost:5001/api/users/profile/upload-picture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        updateUser({ ...user, profilePicture: result.data.profilePicture })
        toast.success('Profile image updated successfully!')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to upload profile picture')
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error)
      toast.error('Failed to upload profile picture')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    const response = await fetch('http://localhost:5001/api/user/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    })

    if (response.ok) {
      toast.success('Password updated successfully!')
    } else {
      const error = await response.json()
      throw new Error(error.message || 'Failed to update password')
    }
  }

  const handleSettingsUpdate = async (settings: any) => {
    setAccountSettings(settings)
    toast.success('Settings updated successfully!')
  }

  const handleSystemSettingsUpdate = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/admin/system-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(systemSettings)
      })

      if (response.ok) {
        toast.success('System settings updated successfully!')
      } else {
        toast.error('Failed to update system settings')
      }
    } catch (error) {
      console.error('Error updating system settings:', error)
      toast.error('Failed to update system settings')
    }
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const getKYCStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100'
      case 'rejected': return 'text-red-600 bg-red-100'
      default: return 'text-yellow-600 bg-yellow-100'
    }
  }

  const getKYCStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return CheckCircle
      case 'rejected': return X
      default: return Clock
    }
  }

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case 'good': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  if (!user || !editedUser) {
    return <div>Loading...</div>
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: UserIcon },
    { id: 'password', label: 'Password', icon: Edit3 },
    { id: 'wallet', label: 'Wallet', icon: CreditCard },
    { id: 'settings', label: 'Account', icon: AlertCircle },
    { id: 'system', label: 'System', icon: SettingsIcon }
  ]

  const KYCStatusIcon = getKYCStatusIcon(user.kycStatus)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Profile</h1>
        <p className="text-gray-600 mt-1">Manage your admin account and system settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Overview */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="text-center">
              <ProfileImage
                currentImage={user.profilePicture}
                userName={user.fullName}
                onImageUpdate={handleImageUpdate}
                size="lg"
              />
              <h2 className="text-xl font-semibold text-gray-900 mt-4">{user.fullName}</h2>
              <p className="text-gray-600">{user.email}</p>
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Administrator
                </span>
              </div>
            </div>

            {/* KYC Status */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">KYC Status</span>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getKYCStatusColor(user.kycStatus)}`}>
                  <KYCStatusIcon className="w-3 h-3 mr-1" />
                  {user.kycStatus.charAt(0).toUpperCase() + user.kycStatus.slice(1)}
                </div>
              </div>
            </div>

            {/* Wallet Status */}
            {user.walletAddress && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Wallet</span>
                  <span className="text-xs font-mono text-gray-600">
                    {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                  </span>
                </div>
              </div>
            )}

            {/* System Health */}
            {adminStats && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">System Health</span>
                  <span className={`text-xs font-medium uppercase ${getSystemHealthColor(adminStats.systemHealth)}`}>
                    {adminStats.systemHealth}
                  </span>
                </div>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full mt-6 flex items-center justify-center space-x-2 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Admin Stats Overview */}
          {adminStats && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Admin Overview</span>
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{adminStats.loansApproved}</div>
                    <div className="text-xs text-green-700">Loans Approved</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{adminStats.loansRejected}</div>
                    <div className="text-xs text-red-700">Loans Rejected</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{adminStats.kycVerified}</div>
                    <div className="text-xs text-blue-700">KYC Verified</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{adminStats.totalUsers}</div>
                    <div className="text-xs text-purple-700">Total Users</div>
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-gray-900">
                    ${adminStats.totalLoanAmount.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">Total Loan Amount</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2">
          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                {tabs.map(tab => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSave}
                          disabled={isLoading}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          <span>{isLoading ? 'Saving...' : 'Save'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false)
                            setEditedUser(user)
                          }}
                          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedUser.firstName}
                          onChange={(e) => setEditedUser({...editedUser, firstName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{user.firstName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedUser.lastName}
                          onChange={(e) => setEditedUser({...editedUser, lastName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{user.lastName}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>Email</span>
                      </label>
                      <p className="text-gray-900">{user.email}</p>
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                        <Phone className="w-4 h-4" />
                        <span>Phone</span>
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editedUser.phone || ''}
                          onChange={(e) => setEditedUser({...editedUser, phone: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter phone number"
                        />
                      ) : (
                        <p className="text-gray-900">{user.phone || 'Not provided'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role
                      </label>
                      <p className="text-gray-900 capitalize flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-purple-600" />
                        <span>Administrator</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Administrative privileges</p>
                    </div>
                  </div>

                  {/* Address Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4 flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>Address</span>
                    </label>
                    
                    {isEditing ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <input
                            type="text"
                            placeholder="Street Address"
                            value={getAddressObject(editedUser.address).street}
                            onChange={(e) => updateAddress('street', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="City"
                            value={getAddressObject(editedUser.address).city}
                            onChange={(e) => updateAddress('city', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="State"
                            value={getAddressObject(editedUser.address).state}
                            onChange={(e) => updateAddress('state', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="ZIP Code"
                            value={getAddressObject(editedUser.address).zipCode}
                            onChange={(e) => updateAddress('zipCode', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Country"
                            value={getAddressObject(editedUser.address).country}
                            onChange={(e) => updateAddress('country', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-900">
                        {user.address ? (
                          <div>
                            {(() => {
                              const addr = getAddressObject(user.address)
                              return (
                                <>
                                  <p>{addr.street}</p>
                                  <p>{addr.city}, {addr.state} {addr.zipCode}</p>
                                  <p>{addr.country}</p>
                                </>
                              )
                            })()}
                          </div>
                        ) : (
                          <p className="text-gray-500">No address provided</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'password' && (
                <PasswordChange onPasswordChange={handlePasswordChange} />
              )}

              {activeTab === 'wallet' && (
                <WalletConnection />
              )}

              {activeTab === 'settings' && (
                <AccountSettings
                  currentSettings={accountSettings}
                  onSettingsUpdate={handleSettingsUpdate}
                />
              )}

              {activeTab === 'system' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                    <Database className="w-5 h-5" />
                    <span>System Settings</span>
                  </h3>

                  {/* Interest Rates */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-4">Interest Rate Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rate (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={systemSettings.interestRates.min}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            interestRates: { ...systemSettings.interestRates, min: parseFloat(e.target.value) }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Rate (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={systemSettings.interestRates.max}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            interestRates: { ...systemSettings.interestRates, max: parseFloat(e.target.value) }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Default Rate (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={systemSettings.interestRates.default}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            interestRates: { ...systemSettings.interestRates, default: parseFloat(e.target.value) }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Loan Limits */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-4">Loan Amount Limits</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Amount ($)</label>
                        <input
                          type="number"
                          value={systemSettings.loanLimits.min}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            loanLimits: { ...systemSettings.loanLimits, min: parseInt(e.target.value) }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Amount ($)</label>
                        <input
                          type="number"
                          value={systemSettings.loanLimits.max}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            loanLimits: { ...systemSettings.loanLimits, max: parseInt(e.target.value) }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* KYC Requirements */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-4">KYC Configuration</h4>
                    <div className="space-y-4">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={systemSettings.kycRequirements.autoApproval}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            kycRequirements: { ...systemSettings.kycRequirements, autoApproval: e.target.checked }
                          })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Enable automatic KYC approval for qualified applicants</span>
                      </label>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Document Expiry (days)</label>
                        <input
                          type="number"
                          value={systemSettings.kycRequirements.documentExpiry}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            kycRequirements: { ...systemSettings.kycRequirements, documentExpiry: parseInt(e.target.value) }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* System Maintenance */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-4">Maintenance Mode</h4>
                    <div className="space-y-4">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={systemSettings.systemMaintenance.enabled}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            systemMaintenance: { ...systemSettings.systemMaintenance, enabled: e.target.checked }
                          })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Enable maintenance mode</span>
                      </label>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Maintenance Message</label>
                        <textarea
                          value={systemSettings.systemMaintenance.message}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            systemMaintenance: { ...systemSettings.systemMaintenance, message: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                          placeholder="Message to display during maintenance..."
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSystemSettingsUpdate}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Update System Settings
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminProfile
