import { useState } from 'react'
import { useQuery } from 'react-query'
import { apiService } from '../../services/api'
import { Loan } from '../../types'
import React from 'react'
import { 
  TrendingUp, 
  DollarSign, 
  Coins, 
  ExternalLink,
  Grid,
  List,
  RefreshCw,
  AlertCircle,
  PieChart,
  BarChart3,
  Calendar,
  Activity
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'

interface PortfolioLoan extends Loan {
  nftTokenId?: string
  nftValue?: number
  performance?: 'excellent' | 'good' | 'average' | 'poor'
  lastUpdated?: string
}

const Portfolio = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterBy, setFilterBy] = useState<'all' | 'active' | 'completed' | 'pending'>('all')
  const [sortBy, setSortBy] = useState<'amount' | 'date' | 'performance'>('amount')

  // Fetch user's loan portfolio
  const { data: loanPortfolio, isLoading, error, refetch } = useQuery(
    ['user-loan-portfolio'],
    () => apiService.getMyLoans(),
    {
      refetchInterval: 30000,
      retry: 3,
      onError: (error) => {
        console.error('Portfolio error:', error)
        toast.error('Failed to load portfolio data. Using demo data.')
      }
    }
  )

  // Demo portfolio data for when API fails
  const demoPortfolio: PortfolioLoan[] = [
    {
      _id: 'portfolio-1',
      userId: 'user-123' as any,
      amount: 25000,
      interestRate: 7.5,
      termMonths: 18,
      purpose: 'Bored Ape NFT Collection',
      status: 'active',
      requestDate: new Date('2024-01-01').toISOString(),
      approvalDate: new Date('2024-01-02').toISOString(),
      totalRepaid: 8500,
      remainingBalance: 16500,
      createdAt: new Date('2024-01-01').toISOString(),
      updatedAt: new Date().toISOString(),
      nftTokenId: '#4521',
      nftValue: 28000,
      performance: 'excellent',
      lastUpdated: new Date().toISOString(),
      monthlyPayment: 1547,
      totalInterest: 3375
    },
    {
      _id: 'portfolio-2',
      userId: 'user-123' as any,
      amount: 12000,
      interestRate: 9.2,
      termMonths: 12,
      purpose: 'CryptoPunks Investment',
      status: 'active',
      requestDate: new Date('2024-01-15').toISOString(),
      approvalDate: new Date('2024-01-16').toISOString(),
      totalRepaid: 3200,
      remainingBalance: 8800,
      createdAt: new Date('2024-01-15').toISOString(),
      updatedAt: new Date().toISOString(),
      nftTokenId: '#7892',
      nftValue: 13500,
      performance: 'good',
      lastUpdated: new Date().toISOString(),
      monthlyPayment: 1089,
      totalInterest: 1107
    },
    {
      _id: 'portfolio-3',
      userId: 'user-123' as any,
      amount: 8000,
      interestRate: 8.8,
      termMonths: 6,
      purpose: 'Art Blocks Collectible',
      status: 'completed',
      requestDate: new Date('2023-08-01').toISOString(),
      approvalDate: new Date('2023-08-02').toISOString(),
      totalRepaid: 8352,
      remainingBalance: 0,
      createdAt: new Date('2023-08-01').toISOString(),
      updatedAt: new Date('2023-12-15').toISOString(),
      nftTokenId: '#3456',
      nftValue: 9200,
      performance: 'excellent',
      lastUpdated: new Date('2023-12-15').toISOString(),
      monthlyPayment: 1392,
      totalInterest: 352
    }
  ]

  // Get loans from API or use demo data
  const loans = error ? demoPortfolio : (loanPortfolio?.data?.loans || [])

  // Filter loans based on status
  const filteredLoans = loans.filter((loan: PortfolioLoan) => {
    if (filterBy === 'all') return true
    return loan.status === filterBy
  })

  // Sort loans
  const sortedLoans = [...filteredLoans].sort((a, b) => {
    switch (sortBy) {
      case 'amount':
        return b.amount - a.amount
      case 'date':
        return new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
      case 'performance':
        const performanceOrder: { [key: string]: number } = { excellent: 4, good: 3, average: 2, poor: 1 }
        const aPerf = (a as PortfolioLoan).performance || 'average'
        const bPerf = (b as PortfolioLoan).performance || 'average'
        return (performanceOrder[bPerf] || 2) - (performanceOrder[aPerf] || 2)
      default:
        return 0
    }
  })

  // Calculate portfolio statistics
  const portfolioStats = {
    totalLoans: sortedLoans.length,
    totalValue: sortedLoans.reduce((sum, loan) => sum + loan.amount, 0),
    totalRepaid: sortedLoans.reduce((sum, loan) => sum + loan.totalRepaid, 0),
    remainingBalance: sortedLoans.reduce((sum, loan) => sum + loan.remainingBalance, 0),
    activeLoans: sortedLoans.filter(loan => loan.status === 'active').length,
    completedLoans: sortedLoans.filter(loan => loan.status === 'completed').length,
    avgInterestRate: sortedLoans.length > 0 ? sortedLoans.reduce((sum, loan) => sum + loan.interestRate, 0) / sortedLoans.length : 0
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getPerformanceColor = (performance: string | undefined) => {
    switch (performance) {
      case 'excellent': return 'text-green-600 bg-green-100'
      case 'good': return 'text-blue-600 bg-blue-100'
      case 'average': return 'text-yellow-600 bg-yellow-100'
      case 'poor': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'completed': return 'text-blue-600 bg-blue-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'rejected': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
                  <div className="h-20 bg-gray-300 rounded mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Portfolio</h1>
              <p className="text-gray-600">Track your NFT loans and investments</p>
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              {error && (
                <button
                  onClick={() => refetch()}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              ) as React.ReactNode}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Portfolio Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <PieChart className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Loans</p>
                  <p className="text-xl font-bold text-gray-900">{portfolioStats.totalLoans}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(portfolioStats.totalValue)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Repaid</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(portfolioStats.totalRepaid)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg. Rate</p>
                  <p className="text-xl font-bold text-gray-900">{portfolioStats.avgInterestRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <p className="text-yellow-800">
                  Unable to load live portfolio data. Showing demo portfolio.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filter by Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Loans</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="amount">Loan Amount</option>
                <option value="date">Request Date</option>
                <option value="performance">Performance</option>
              </select>
            </div>

            {/* Performance Summary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio Health</label>
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-600">Healthy Portfolio</span>
                <span className="text-xs text-gray-500">({portfolioStats.activeLoans} active)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Loans */}
        {sortedLoans.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Coins className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No loans found</h3>
            <p className="text-gray-600 mb-4">Start by applying for your first NFT loan</p>
            <Link
              to="/loan/apply"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply for Loan
            </Link>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-4"
          }>
            {sortedLoans.map((loan) => (
              <div key={loan._id} className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow ${
                viewMode === 'list' ? 'p-6' : 'p-6'
              }`}>
                {viewMode === 'grid' ? (
                  // Grid View
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{loan.purpose}</h3>
                        {(loan as PortfolioLoan).nftTokenId && (
                          <p className="text-sm text-gray-600 mb-2">Token ID: {(loan as PortfolioLoan).nftTokenId}</p>
                        )}
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                            {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                          </span>
                          {(loan as PortfolioLoan).performance && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPerformanceColor((loan as PortfolioLoan).performance)}`}>
                              {((loan as PortfolioLoan).performance?.charAt(0).toUpperCase() || '') + ((loan as PortfolioLoan).performance?.slice(1) || '')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Loan Amount</span>
                        <span className="text-lg font-bold text-gray-900">{formatCurrency(loan.amount)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Interest Rate</span>
                        <span className="text-sm font-medium text-blue-600">{loan.interestRate}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Term</span>
                        <span className="text-sm text-gray-900">{loan.termMonths} months</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Repaid</span>
                        <span className="text-sm font-medium text-green-600">{formatCurrency(loan.totalRepaid)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Remaining</span>
                        <span className="text-sm font-medium text-orange-600">{formatCurrency(loan.remainingBalance)}</span>
                      </div>
                      {(loan as PortfolioLoan).nftValue && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">NFT Value</span>
                          <span className="text-sm font-bold text-purple-600">{formatCurrency((loan as PortfolioLoan).nftValue || 0)}</span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Repayment Progress</span>
                        <span>{((loan.totalRepaid / loan.amount) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(loan.totalRepaid / loan.amount) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(loan.requestDate)}
                      </div>
                      <Link
                        to={`/loan/${loan._id}`}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        View Details
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Link>
                    </div>
                  </>
                ) : (
                  // List View
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-6">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{loan.purpose}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                              {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                            </span>
                            {(loan as PortfolioLoan).nftTokenId && (
                              <span className="text-xs text-gray-500">Token: {(loan as PortfolioLoan).nftTokenId}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">{formatCurrency(loan.amount)}</p>
                          <p className="text-sm text-blue-600">{loan.interestRate}% APR</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-green-600">{formatCurrency(loan.totalRepaid)}</p>
                          <p className="text-sm text-gray-500">repaid</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-orange-600">{formatCurrency(loan.remainingBalance)}</p>
                          <p className="text-sm text-gray-500">remaining</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{loan.termMonths} months</p>
                          <p className="text-sm text-gray-500">{formatDate(loan.requestDate)}</p>
                        </div>
                        <Link
                          to={`/loan/${loan._id}`}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Portfolio
