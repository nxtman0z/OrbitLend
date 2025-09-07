import { useState } from 'react'
import { useQuery } from 'react-query'
import { apiService } from '../../services/api'
import { Loan } from '../../types'
import { Search, Filter, Clock, DollarSign, TrendingUp, Users, Star, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'amount' | 'interestRate' | 'duration' | 'newest'>('newest')
  const [filterByAmount, setFilterByAmount] = useState<'all' | 'small' | 'medium' | 'large'>('all')
  const [filterByRate, setFilterByRate] = useState<'all' | 'low' | 'medium' | 'high'>('all')

  // Fetch approved loans for marketplace using regular loans endpoint with approved status filter
  const { data: loansResponse, isLoading, error } = useQuery(
    ['marketplace-loans', { searchTerm, sortBy, filterByAmount, filterByRate }],
    () => apiService.getMyLoans({
      purpose: searchTerm || undefined,
      sortBy,
      page: 1,
      limit: 50
    }),
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  )

  const allLoans = loansResponse?.data?.loans || []
  // Filter to only show approved loans that could be funded by others
  const loans = allLoans.filter(loan => loan.status === 'approved')

  const getAmountCategory = (amount: number) => {
    if (amount < 1) return 'small'
    if (amount < 10) return 'medium'
    return 'large'
  }

  const getRateCategory = (rate: number) => {
    if (rate < 5) return 'low'
    if (rate < 15) return 'medium'
    return 'high'
  }

  const filteredLoans = loans.filter((loan: Loan) => {
    const userSearchTerm = typeof loan.userId === 'string' ? loan.userId : loan.userId?.email || ''
    const matchesSearch = loan.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userSearchTerm.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         loan.amount.toString().includes(searchTerm)
    
    const matchesAmount = filterByAmount === 'all' || getAmountCategory(loan.amount) === filterByAmount
    const matchesRate = filterByRate === 'all' || getRateCategory(loan.interestRate) === filterByRate
    
    return matchesSearch && matchesAmount && matchesRate
  })

  const sortedLoans = [...filteredLoans].sort((a, b) => {
    switch (sortBy) {
      case 'amount':
        return b.amount - a.amount
      case 'interestRate':
        return b.interestRate - a.interestRate
      case 'duration':
        return (a.termMonths || 0) - (b.termMonths || 0)
      case 'newest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  const stats = {
    totalLoans: loans.length,
    totalValue: loans.reduce((sum, loan) => sum + loan.amount, 0),
    avgInterestRate: loans.length > 0 ? loans.reduce((sum, loan) => sum + loan.interestRate, 0) / loans.length : 0,
    popularCategory: 'Business Investment' // This could be calculated from data
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Failed to load marketplace data. Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Loan Marketplace</h1>
        <p className="text-gray-600">Discover and fund approved loan opportunities</p>
      </div>

      {/* Market Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Available Loans</p>
              <p className="text-2xl font-bold">{stats.totalLoans}</p>
            </div>
            <Users className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Value</p>
              <p className="text-2xl font-bold">{stats.totalValue.toFixed(2)} ETH</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Avg Interest Rate</p>
              <p className="text-2xl font-bold">{stats.avgInterestRate.toFixed(1)}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Popular Category</p>
              <p className="text-lg font-bold">{stats.popularCategory}</p>
            </div>
            <Star className="h-8 w-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search loans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="amount">Highest Amount</option>
            <option value="interestRate">Highest Rate</option>
            <option value="duration">Shortest Term</option>
          </select>

          {/* Amount Filter */}
          <select
            value={filterByAmount}
            onChange={(e) => setFilterByAmount(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Amounts</option>
            <option value="small">Small (&lt; 1 ETH)</option>
            <option value="medium">Medium (1-10 ETH)</option>
            <option value="large">Large (&gt; 10 ETH)</option>
          </select>

          {/* Rate Filter */}
          <select
            value={filterByRate}
            onChange={(e) => setFilterByRate(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Rates</option>
            <option value="low">Low (&lt; 5%)</option>
            <option value="medium">Medium (5-15%)</option>
            <option value="high">High (&gt; 15%)</option>
          </select>
        </div>
      </div>

      {/* Loan Listings */}
      {sortedLoans.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Filter className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No loans found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedLoans.map((loan: Loan) => (
            <div key={loan._id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {loan.purpose}
                    </h3>
                    <p className="text-sm text-gray-500">
                      by {typeof loan.userId === 'string' ? loan.userId : loan.userId?.email || 'Anonymous'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{loan.amount} ETH</p>
                    <p className="text-sm text-green-600 font-medium">{loan.interestRate}% APR</p>
                  </div>
                </div>

                {/* Loan Details */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    {loan.termMonths || 'N/A'} months
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 mr-2" />
                    {((loan.amount * (loan.interestRate / 100) * ((loan.termMonths || 1) / 12)) + loan.amount).toFixed(2)} ETH total
                  </div>
                </div>

                {/* Collateral Info */}
                {loan.collateral && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-xs font-medium text-gray-700 mb-1">Collateral</p>
                    <p className="text-sm text-gray-600">{loan.collateral.type} - {loan.collateral.value} ETH</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{loan.collateral.description}</p>
                  </div>
                )}

                {/* Risk Assessment */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Risk Level:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      loan.interestRate < 5 ? 'bg-green-100 text-green-800' :
                      loan.interestRate < 15 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {loan.interestRate < 5 ? 'Low' : loan.interestRate < 15 ? 'Medium' : 'High'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Listed {new Date(loan.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Link
                    to={`/loans/${loan._id}`}
                    className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    View Details
                  </Link>
                  <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Fund Loan
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More / Pagination could go here */}
      {sortedLoans.length > 0 && (
        <div className="mt-8 text-center">
          <button className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Load More Loans
          </button>
        </div>
      )}
    </div>
  )
}

export default Marketplace
