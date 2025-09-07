import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50">
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
                      className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group ${
                        isActiveRoute(item.href)
                          ? 'bg-primary-100 text-primary-700 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActiveRoute(item.href) ? 'text-primary-600' : 'group-hover:text-gray-700'}`} />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  {/* User menu */}
                  <div className="hidden md:flex items-center space-x-4">
                    <div className="flex items-center space-x-3 bg-gray-50 rounded-xl px-4 py-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {user?.firstName?.charAt(0)}
                        </span>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">Welcome, {user?.firstName}</div>
                        {user?.role === 'admin' && (
                          <span className="bg-gradient-to-r from-primary-500 to-purple-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      to="/profile"
                      className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-300"
                    >
                      <User className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Mobile menu button */}
                  <div className="md:hidden">
                    <button
                      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                      className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-300"
                    >
                      {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-gray-900 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-gray-100"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
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
          <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-md">
            <div className="px-4 pt-4 pb-6 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                      isActiveRoute(item.href)
                        ? 'bg-primary-100 text-primary-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
              
              <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
                <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user?.firstName?.charAt(0)}
                    </span>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">{user?.firstName}</div>
                    {user?.role === 'admin' && (
                      <span className="bg-gradient-to-r from-primary-500 to-purple-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
                
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-300"
                >
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    handleLogout()
                  }}
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 w-full text-left transition-all duration-300"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
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
      <footer className="bg-gray-900 text-white">
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
                  <div className="text-sm text-gray-400">DeFi Lending Platform</div>
                </div>
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed max-w-md">
                Revolutionizing the lending industry with blockchain technology, NFT tokenization, and decentralized finance protocols.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-6">Platform</h3>
              <ul className="space-y-3">
                <li><Link to="/marketplace" className="text-gray-300 hover:text-white transition-colors">Marketplace</Link></li>
                <li><Link to="/loans/request" className="text-gray-300 hover:text-white transition-colors">Request Loan</Link></li>
                <li><Link to="/portfolio" className="text-gray-300 hover:text-white transition-colors">Portfolio</Link></li>
                <li><Link to="/kyc" className="text-gray-300 hover:text-white transition-colors">KYC Verification</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-6">Support</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 OrbitLend. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout