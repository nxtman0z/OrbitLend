import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { 
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
  Edit,
  X,
  CheckCircle,
  AlertCircle,
  LogOut,
  Shield
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { apiService } from '../../services/api'
import { useAuthStore } from '../../stores/authStore'

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string
  address?: string
  profilePicture?: string
}

interface ProfileInfoProps {
  userRole?: 'user' | 'admin'
}

const ProfileInfo = ({ userRole = 'user' }: ProfileInfoProps) => {
  const { user, updateUser, logout } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || user?.phone || '',
    address: typeof user?.address === 'string' ? user.address : '',
    profilePicture: user?.profilePicture || '',
  })

  // Fetch user profile
  const { data: profileData, isLoading } = useQuery(
    'user-profile',
    () => apiService.getProfile(),
    {
      onSuccess: (data) => {
        const profile = data.data
        setFormData({
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          email: profile.email || '',
          phoneNumber: profile.phoneNumber || '',
          address: typeof profile.address === 'string' ? profile.address : '',
          profilePicture: profile.profilePicture || ''
        })
      }
    }
  )

  // Update profile mutation
  const updateProfileMutation = useMutation(
    (data: Partial<ProfileData>) => apiService.updateProfile(data),
    {
      onSuccess: (response) => {
        toast.success('Profile updated successfully!')
        updateUser(response.data)
        queryClient.invalidateQueries('user-profile')
        setIsEditing(false)
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Failed to update profile')
      }
    }
  )

  // Profile picture upload mutation
  const uploadProfilePictureMutation = useMutation(
    (file: File) => apiService.uploadProfilePicture(file),
    {
      onSuccess: (response) => {
        const newProfilePicture = response.data.profilePicture
        toast.success('Profile picture updated successfully!')
        
        // Update form data
        setFormData(prev => ({ ...prev, profilePicture: newProfilePicture }))
        
        // Update user in auth store
        updateUser({ ...user, profilePicture: newProfilePicture })
        
        // Invalidate and refetch queries to ensure data consistency
        queryClient.invalidateQueries('user-profile')
        queryClient.refetchQueries('user-profile')
        
        setIsUploadingImage(false)
      },
      onError: (error: any) => {
        console.error('Profile picture upload error:', error)
        toast.error(error?.response?.data?.message || 'Failed to upload profile picture')
        setIsUploadingImage(false)
      }
    }
  )

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('First name and last name are required')
      return
    }

    updateProfileMutation.mutate(formData)
  }

  const handleCancel = () => {
    // Reset form data to original values
    const profile = profileData?.data || user
    setFormData({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      email: profile?.email || '',
      phoneNumber: profile?.phoneNumber || '',
      address: typeof profile?.address === 'string' ? profile.address : '',
      profilePicture: profile?.profilePicture || ''
    })
    setIsEditing(false)
  }

  const getInitials = () => {
    return `${formData.firstName.charAt(0)}${formData.lastName.charAt(0)}`.toUpperCase()
  }

  const getImageUrl = (url: string) => {
    if (!url) return ''
    
    // If URL is already full URL, return as is
    if (url.startsWith('http')) return url
    
    // If relative URL, construct full URL
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    return `${baseUrl}${url}`
  }

  const handleLogout = () => {
    logout()
    toast.success('Successfully logged out!')
    navigate('/login')
  }

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false)
    handleLogout()
  }

  const handleProfilePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

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

    setIsUploadingImage(true)
    uploadProfilePictureMutation.mutate(file)
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <User className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              disabled={updateProfileMutation.isLoading}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {updateProfileMutation.isLoading ? (
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Profile Picture */}
        <div className="flex items-center space-x-6">
          <div className="relative">
            {formData.profilePicture ? (
              <img
                src={`${getImageUrl(formData.profilePicture)}?t=${Date.now()}`}
                alt="Profile"
                className="h-20 w-20 rounded-full object-cover"
                onError={(e) => {
                  console.error('Failed to load profile picture:', formData.profilePicture)
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
                {getInitials()}
              </div>
            )}
            {isEditing && (
              <label className="absolute -bottom-1 -right-1 h-8 w-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  className="hidden"
                  disabled={isUploadingImage}
                />
                {isUploadingImage ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </label>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {formData.firstName} {formData.lastName}
            </h3>
            <p className="text-gray-500 capitalize">{userRole}</p>
            <div className="flex items-center mt-1">
              {user?.kyc?.status === 'approved' ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm">Verified</span>
                </div>
              ) : (
                <div className="flex items-center text-yellow-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm">Pending Verification</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className="input-field"
                placeholder="Enter first name"
              />
            ) : (
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <User className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-900">{formData.firstName || 'Not provided'}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name *
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="input-field"
                placeholder="Enter last name"
              />
            ) : (
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <User className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-900">{formData.lastName || 'Not provided'}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <Mail className="h-5 w-5 text-gray-400 mr-3" />
              <span className="text-gray-900">{formData.email}</span>
              <span className="ml-2 text-xs text-gray-500">(Cannot be changed)</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                className="input-field"
                placeholder="Enter phone number"
              />
            ) : (
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <Phone className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-900">{formData.phoneNumber || 'Not provided'}</span>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            {isEditing ? (
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="input-field"
                rows={3}
                placeholder="Enter your address"
              />
            ) : (
              <div className="flex items-start p-3 bg-gray-50 rounded-lg">
                <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <span className="text-gray-900">{formData.address || 'Not provided'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Account Actions */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
          <div className="space-y-4">
            {/* Logout Section */}
            {!showLogoutConfirm ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-red-100 p-2 rounded-lg">
                      <LogOut className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-red-900">Sign Out</h4>
                      <p className="text-sm text-red-700">
                        Sign out of your OrbitLend account
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Shield className="h-5 w-5 text-red-600" />
                  <h4 className="font-medium text-red-900">Confirm Sign Out</h4>
                </div>
                <p className="text-sm text-red-700 mb-4">
                  Are you sure you want to sign out? You'll need to log in again to access your account.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={handleLogoutConfirm}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Yes, Sign Out
                  </button>
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Info for Admin */}
        {userRole === 'admin' && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700">Admin Level</p>
                <p className="text-lg font-semibold text-blue-900">Super Admin</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-700">Permissions</p>
                <p className="text-lg font-semibold text-green-900">Full Access</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-700">Last Login</p>
                <p className="text-lg font-semibold text-purple-900">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfileInfo
