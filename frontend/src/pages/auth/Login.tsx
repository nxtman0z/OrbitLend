import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, User, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '../../stores/authStore'
import WalletLogin from '../../components/WalletLogin'

// Login form schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  userType: z.enum(['user', 'admin'], {
    required_error: 'Please select user type',
  }),
})

type LoginFormData = z.infer<typeof loginSchema>

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      userType: 'user',
    },
  })

  const userType = watch('userType')

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Update auth store
        setAuth(result.data.user, result.data.token)
        
        toast.success(`Welcome back, ${result.data.user.firstName}!`)
        
        // Redirect based on user role
        if (result.data.user.role === 'admin') {
          navigate('/admin')
        } else {
          navigate('/dashboard')
        }
      } else {
        toast.error(result.message || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: `linear-gradient(135deg, rgb(var(--bg-primary)), rgb(var(--bg-secondary)))`
    }}>
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 glass-premium rounded-2xl flex items-center justify-center mb-4 shadow-2xl">
            <img 
              src="/logo-optimized.jpg" 
              alt="OrbitLend Logo" 
              className="w-16 h-16 rounded-xl object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: `rgb(var(--text-primary))` }}>
            Welcome Back
          </h1>
          <p style={{ color: `rgb(var(--text-secondary))` }}>
            Sign in to your OrbitLend account
          </p>
        </div>

        {/* Login Form */}
        <div className="glass-premium rounded-2xl p-8 shadow-2xl">
          {/* User Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-3" style={{ color: `rgb(var(--text-primary))` }}>
              Login as
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setValue('userType', 'user')}
                className={`flex-1 p-3 rounded-xl border-2 transition-all duration-200 ${
                  userType === 'user'
                    ? 'border-indigo-400 bg-indigo-500/20'
                    : 'border-gray-400/30 hover:border-gray-300'
                }`}
                style={{
                  color: userType === 'user' ? `rgb(var(--color-primary))` : `rgb(var(--text-secondary))`,
                  background: userType === 'user' ? `rgb(var(--color-primary) / 0.1)` : `rgb(var(--bg-card))`,
                  borderColor: userType === 'user' ? `rgb(var(--color-primary))` : `rgb(var(--border-primary))`
                }}
              >
                <User className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm font-medium">User</span>
              </button>
              <button
                type="button"
                onClick={() => setValue('userType', 'admin')}
                className={`flex-1 p-3 rounded-xl border-2 transition-all duration-200 ${
                  userType === 'admin'
                    ? 'border-purple-400 bg-purple-500/20'
                    : 'border-gray-400/30 hover:border-gray-300'
                }`}
                style={{
                  color: userType === 'admin' ? `rgb(var(--color-secondary))` : `rgb(var(--text-secondary))`,
                  background: userType === 'admin' ? `rgb(var(--color-secondary) / 0.1)` : `rgb(var(--bg-card))`,
                  borderColor: userType === 'admin' ? `rgb(var(--color-secondary))` : `rgb(var(--border-primary))`
                }}
              >
                <Shield className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm font-medium">Admin</span>
              </button>
            </div>
            {errors.userType && (
              <p className="text-red-500 text-sm mt-1">{errors.userType.message}</p>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: `rgb(var(--text-primary))` }}>
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5" style={{ color: `rgb(var(--text-muted))` }} />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  className="input-premium pl-16"
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: `rgb(var(--text-primary))` }}>
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5" style={{ color: `rgb(var(--text-muted))` }} />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="input-premium pl-16 pr-16"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center transition-colors"
                  style={{ color: `rgb(var(--text-muted))` }}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`btn-premium w-full ${
                userType === 'admin'
                  ? 'from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700'
                  : ''
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Signing in...
                </div>
              ) : (
                `Sign in as ${userType === 'admin' ? 'Admin' : 'User'}`
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t" style={{ borderColor: `rgb(var(--border-primary))` }}></div>
            <span className="px-4 text-sm" style={{ color: `rgb(var(--text-muted))` }}>OR</span>
            <div className="flex-1 border-t" style={{ borderColor: `rgb(var(--border-primary))` }}></div>
          </div>

          {/* Wallet Login */}
          <div className="space-y-4">
            <WalletLogin onSuccess={() => {/* Handle success if needed */}} />
          </div>

          {/* Footer Links */}
          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: `rgb(var(--text-secondary))` }}>
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/register')}
                className="font-semibold transition-colors hover:underline"
                style={{ color: `rgb(var(--color-primary))` }}
              >
                Sign up
              </button>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-xs" style={{ color: `rgb(var(--text-muted))` }}>
            By signing in, you agree to our{' '}
            <span className="cursor-pointer hover:underline transition-colors" style={{ color: `rgb(var(--color-primary))` }}>
              Terms of Service
            </span>
            {' '}and{' '}
            <span className="cursor-pointer hover:underline transition-colors" style={{ color: `rgb(var(--color-primary))` }}>
              Privacy Policy
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
