import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from 'react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { Eye, EyeOff, Mail, Lock, User, Shield, LogIn } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import apiService from '../../services/api'
import { LoginRequest } from '../../types'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
})

type LoginFormData = z.infer<typeof loginSchema>

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [loginType, setLoginType] = useState<'user' | 'admin'>('user')
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => apiService.simpleAuthLogin(data),
    onSuccess: (response: { user: any }) => {
      setAuth(response.user, null) // No token needed for simple auth
      toast.success(`Welcome back, ${response.user.name}!`)
      
      // Redirect based on user role
      if (response.user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.'
      toast.error(message)
    }
  })

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data)
  }

  const handleQuickFill = (type: 'user' | 'admin') => {
    const credentials = {
      user: { email: 'test@example.com', password: 'password123' },
      admin: { email: 'admin@example.com', password: 'admin123' }
    }
    
    setValue('email', credentials[type].email)
    setValue('password', credentials[type].password)
    setLoginType(type)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">O</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
              Sign up here
            </Link>
          </p>
        </div>

        {/* Login Type Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setLoginType('user')}
              className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                loginType === 'user'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-center mb-2">
                <User className={`h-6 w-6 ${loginType === 'user' ? 'text-blue-600' : 'text-gray-400'}`} />
              </div>
              <h4 className="font-semibold mb-1">User Login</h4>
              <p className="text-sm text-gray-600">Access your dashboard and loans</p>
            </button>

            <button
              type="button"
              onClick={() => setLoginType('admin')}
              className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                loginType === 'admin'
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-center mb-2">
                <Shield className={`h-6 w-6 ${loginType === 'admin' ? 'text-purple-600' : 'text-gray-400'}`} />
              </div>
              <h4 className="font-semibold mb-1">Admin Login</h4>
              <p className="text-sm text-gray-600">Manage users and platform</p>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  className="input-field pl-10"
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pl-10 pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isLoading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all duration-300 ${
                loginType === 'admin'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
                  : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5`}
            >
              {loginMutation.isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign in as {loginType === 'admin' ? 'Admin' : 'User'}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Demo Accounts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Demo Accounts</h3>
            <p className="text-sm text-gray-600">Try the platform with test accounts</p>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => handleQuickFill('user')}
              className="w-full flex items-center justify-center py-2 px-4 border-2 border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all duration-300"
            >
              <User className="h-4 w-4 mr-2" />
              Fill User Credentials
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin')}
              className="w-full flex items-center justify-center py-2 px-4 border-2 border-purple-200 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-all duration-300"
            >
              <Shield className="h-4 w-4 mr-2" />
              Fill Admin Credentials
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Demo credentials will be auto-filled. Click "Sign in" after filling.
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <Shield className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                Secure Login
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Your login is protected with JWT authentication and secure password hashing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
