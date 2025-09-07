import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import ThemeToggle from './ThemeToggle'
import { 
  Menu, 
  X, 
  Home, 
  DollarSign, 
  CreditCard, 
  ShoppingCart, 
  Briefcase, 
  User, 
  LogOut,
  Shield,
  Users,
  FileText,
  BarChart3
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface LayoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const userNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'My Loans', href: '/loans/my-loans', icon: CreditCard },
    { name: 'Request Loan', href: '/loans/request', icon: DollarSign },
    { name: 'Marketplace', href: '/marketplace', icon: ShoppingCart },
    { name: 'Portfolio', href: '/portfolio', icon: Briefcase },
    { name: 'KYC Verification', href: '/kyc', icon: Shield },
  ]

  const adminNavItems = [
    { name: 'Admin Dashboard', href: '/admin', icon: BarChart3 },
    { name: 'Manage Loans', href: '/admin/loans', icon: FileText },
    { name: 'Manage Users', href: '/admin/users', icon: Users },
  ]

  const navItems = user?.role === 'admin' ? adminNavItems : userNavItems

  const isActiveRoute = (path: string) => {
    return location.pathname === path
  }

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ 
      background: `rgb(var(--bg-secondary))`,
      color: `rgb(var(--text-primary))`
    }}>
      {/* Navigation */}
      <nav className="glass-premium sticky top-0 z-50 border-b" style={{
        borderColor: `rgb(var(--border-primary))`
      }}>
        <div className="container-responsive">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to={isAuthenticated ? (user?.role === 'admin' ? '/admin' : '/dashboard') : '/'} className="flex items-center space-x-3 group">
              <div className="relative">
                <img 
                  src="/logo-optimized.jpg" 
                  alt="OrbitLend Logo" 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 object-contain"
                />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div className="hidden sm:block">
                <span className="text-xl sm:text-2xl font-bold text-gray-900">OrbitLend</span>
                <div className="text-xs text-gray-500 font-medium">DeFi Lending Platform</div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            {isAuthenticated && (
              <div className="hidden md:flex items-center space-x-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={`nav-item-premium ${
                        isActiveRoute(item.href) ? 'active' : ''
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {isAuthenticated ? (
                <>
                  {/* User menu */}
                  <div className="hidden md:flex items-center space-x-4">
                    <div className="flex items-center space-x-3 glass-card px-4 py-2">
                      <div className="relative">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">
                            {user?.firstName?.charAt(0)}
                          </span>
                        </div>
                        {user?.isWalletUser && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full ring-2 ring-white"></div>
                        )}
                      </div>
                      <div className="text-sm">
                        <div className="font-medium" style={{ color: `rgb(var(--text-primary))` }}>
                          Welcome, {user?.firstName}
                        </div>
                        <div className="flex items-center space-x-2">
                          {user?.role === 'admin' && (
                            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                              Admin
                            </span>
                          )}
                          {user?.isWalletUser && (
                            <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                              Wallet
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Link
                      to="/profile"
                      className="p-2.5 rounded-lg transition-all duration-300 hover:scale-110"
                      style={{ 
                        color: `rgb(var(--text-muted))`,
                        background: `rgb(var(--bg-card))`,
                        border: `1px solid rgb(var(--border-primary))`
                      }}
                    >
                      <User className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                      title="Logout"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>

                  {/* Mobile menu button */}
                  <div className="md:hidden">
                    <button
                      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                      className="p-2.5 rounded-lg transition-all duration-300"
                      style={{ 
                        color: `rgb(var(--text-muted))`,
                        background: `rgb(var(--bg-card))`,
                        border: `1px solid rgb(var(--border-primary))`
                      }}
                    >
                      {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="btn-secondary-premium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="btn-premium"
                  >
                    Sign Up Free
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isAuthenticated && isMobileMenuOpen && (
          <div className="md:hidden glass-premium border-t" style={{
            borderColor: `rgb(var(--border-primary))`
          }}>
            <div className="px-4 pt-4 pb-6 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`nav-item-premium ${
                      isActiveRoute(item.href) ? 'active' : ''
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
              
              <div className="border-t pt-4 mt-4 space-y-2" style={{
                borderColor: `rgb(var(--border-primary))`
              }}>
                <div className="flex items-center space-x-3 glass-card px-4 py-3">
                  <div className="relative">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {user?.firstName?.charAt(0)}
                      </span>
                    </div>
                    {user?.isWalletUser && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full ring-2 ring-white"></div>
                    )}
                  </div>
                  <div className="text-sm">
                    <div className="font-medium" style={{ color: `rgb(var(--text-primary))` }}>
                      {user?.firstName}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      {user?.role === 'admin' && (
                        <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                          Admin
                        </span>
                      )}
                      {user?.isWalletUser && (
                        <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                          Wallet Connected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="nav-item-premium"
                >
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    handleLogout()
                  }}
                  className="nav-item-premium w-full text-left text-red-600 hover:text-red-700 hover:bg-red-100 border-2 border-red-300 bg-red-50 rounded-xl p-4 font-semibold shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <LogOut className="w-5 h-5" />
                      <span>Sign Out</span>
                    </div>
                    <div className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                      Logout
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer style={{ 
        background: `rgb(var(--bg-card))`,
        color: `rgb(var(--text-primary))`,
        borderTop: `1px solid rgb(var(--border-primary))`
      }}>
        <div className="container-responsive py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <img 
                  src="/logo-optimized.jpg" 
                  alt="OrbitLend Logo" 
                  className="w-10 h-10 rounded-xl object-contain"
                />
                <div>
                  <span className="text-2xl font-bold">OrbitLend</span>
                  <div className="text-sm" style={{ color: `rgb(var(--text-muted))` }}>
                    DeFi Lending Platform
                  </div>
                </div>
              </div>
              <p className="mb-6 leading-relaxed max-w-md" style={{ color: `rgb(var(--text-secondary))` }}>
                Revolutionizing the lending industry with blockchain technology, NFT tokenization, and decentralized finance protocols.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-6">Platform</h3>
              <ul className="space-y-3">
                <li><Link to="/marketplace" className="transition-colors duration-300 hover:text-indigo-500" style={{ color: `rgb(var(--text-secondary))` }}>Marketplace</Link></li>
                <li><Link to="/loans/request" className="transition-colors duration-300 hover:text-indigo-500" style={{ color: `rgb(var(--text-secondary))` }}>Request Loan</Link></li>
                <li><Link to="/portfolio" className="transition-colors duration-300 hover:text-indigo-500" style={{ color: `rgb(var(--text-secondary))` }}>Portfolio</Link></li>
                <li><Link to="/kyc" className="transition-colors duration-300 hover:text-indigo-500" style={{ color: `rgb(var(--text-secondary))` }}>KYC Verification</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-6">Support</h3>
              <ul className="space-y-3">
                <li><a href="#" className="transition-colors duration-300 hover:text-indigo-500" style={{ color: `rgb(var(--text-secondary))` }}>Help Center</a></li>
                <li><a href="#" className="transition-colors duration-300 hover:text-indigo-500" style={{ color: `rgb(var(--text-secondary))` }}>Documentation</a></li>
                <li><a href="#" className="transition-colors duration-300 hover:text-indigo-500" style={{ color: `rgb(var(--text-secondary))` }}>Contact Us</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center" style={{
            borderColor: `rgb(var(--border-primary))`
          }}>
            <p className="text-sm" style={{ color: `rgb(var(--text-muted))` }}>
              © 2025 OrbitLend. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-sm transition-colors duration-300 hover:text-indigo-500" style={{ color: `rgb(var(--text-muted))` }}>Privacy Policy</a>
              <a href="#" className="text-sm transition-colors duration-300 hover:text-indigo-500" style={{ color: `rgb(var(--text-muted))` }}>Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout