import { useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle, 
  DollarSign,
  FileText,
  Eye,
  AlertCircle,
  TrendingUp,
  Filter,
  Search
} from 'lucide-react'
import { Loan, LoanFilters } from '../../types'
import apiService from '../../services/api'

const MyLoans = () => {
  const [filters, setFilters] = useState<LoanFilters>({
    status: undefined,
    sortBy: 'requestDate',
    sortOrder: 'desc'
  })
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch user's loans
  const { data: loansResponse, isLoading, error } = useQuery(
    ['my-loans', filters],
    () => apiService.getMyLoans(filters),
    {
      staleTime: 30000, // 30 seconds
      cacheTime: 300000 // 5 minutes
    }
  )

  const loans = loansResponse?.data?.loans || []
  const totalLoans = loansResponse?.data?.pagination?.totalLoans || 0

  // Filter loans by search term
  const filteredLoans = Array.isArray(loans) ? loans.filter((loan: Loan) =>
    loan.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.amount.toString().includes(searchTerm) ||
    loan._id.toLowerCase().includes(searchTerm.toLowerCase())
  ) : []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'approved':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'defaulted':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'approved':
        return <CheckCircle className="w-4 h-4" />
      case 'active':
        return <TrendingUp className="w-4 h-4" />
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'rejected':
        return <XCircle className="w-4 h-4" />
      case 'defaulted':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const calculateProgress = (loan: Loan) => {
    if (loan.status !== 'active') return 0
    const totalAmount = loan.amount + (loan.totalInterest || 0)
    const repaidAmount = loan.totalRepaid || 0
    return Math.min((repaidAmount / totalAmount) * 100, 100)
  }

  // Calculate summary statistics
  const stats = {
    total: totalLoans,
    active: loans.filter((l: Loan) => l.status === 'active').length,
    pending: loans.filter((l: Loan) => l.status === 'pending').length,
    completed: loans.filter((l: Loan) => l.status === 'completed').length,
    totalBorrowed: loans
      .filter((l: Loan) => ['active', 'completed'].includes(l.status))
      .reduce((sum: number, l: Loan) => sum + l.amount, 0),
    totalRepaid: loans.reduce((sum: number, l: Loan) => sum + (l.totalRepaid || 0), 0)
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-red-800">Failed to load loans. Please try again.</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Loans</h1>
        <p className="text-gray-600 mt-2">
          Manage and track your loan applications and active loans
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Loans</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Loans</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Borrowed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(stats.totalBorrowed)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Repaid</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(stats.totalRepaid)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search loans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={filters.status || 'all'}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                status: e.target.value === 'all' ? undefined : e.target.value as any 
              }))}
              className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-')
                setFilters(prev => ({ ...prev, sortBy, sortOrder: sortOrder as 'asc' | 'desc' }))
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="requestDate-desc">Newest First</option>
              <option value="requestDate-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Action Button */}
      <div className="mb-8">
        <Link
          to="/loans/request"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <CreditCard className="w-4 h-4 mr-2" />
          Request New Loan
        </Link>
      </div>

      {/* Loans List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredLoans.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredLoans.map((loan: Loan) => (
              <div key={loan._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {loan.purpose}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(loan.status)}`}>
                        {getStatusIcon(loan.status)}
                        <span className="ml-1 capitalize">{loan.status}</span>
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Loan Amount</p>
                        <p className="font-semibold text-gray-900">{formatCurrency(loan.amount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Interest Rate</p>
                        <p className="font-semibold text-gray-900">{loan.interestRate}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Term</p>
                        <p className="font-semibold text-gray-900">{loan.termMonths} months</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Request Date</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(loan.requestDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar for Active Loans */}
                    {loan.status === 'active' && (
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-500">Repayment Progress</span>
                          <span className="text-sm font-medium text-gray-900">
                            {calculateProgress(loan).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${calculateProgress(loan)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between mt-2 text-sm text-gray-600">
                          <span>Repaid: {formatCurrency(loan.totalRepaid || 0)}</span>
                          <span>Remaining: {formatCurrency(loan.remainingBalance || 0)}</span>
                        </div>
                      </div>
                    )}

                    {/* NFT Information */}
                    {loan.nftTokenId && (
                      <div className="bg-blue-50 rounded-lg p-3 mb-4">
                        <div className="flex items-center">
                          <div className="bg-blue-100 rounded-full p-2 mr-3">
                            <FileText className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-blue-900">NFT Collateral</p>
                            <p className="text-xs text-blue-700">Token ID: {loan.nftTokenId}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {loan.status === 'rejected' && loan.rejectionReason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <div className="flex items-start">
                          <XCircle className="w-4 h-4 text-red-500 mt-0.5 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-red-900">Rejection Reason</p>
                            <p className="text-sm text-red-700">{loan.rejectionReason}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="ml-6">
                    <Link
                      to={`/loans/${loan._id}`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No loans found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filters.status 
                ? 'No loans match your current filters.' 
                : 'You haven\'t submitted any loan requests yet.'
              }
            </p>
            <Link
              to="/loans/request"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Request Your First Loan
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default MyLoans
