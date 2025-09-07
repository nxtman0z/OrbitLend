import { useState } from 'react'
import { useQuery } from 'react-query'
import { 
  Eye, 
  TrendingUp, 
  Clock,
  DollarSign,
  Activity,
  Users,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  ExternalLink,
  Coins,
  Calendar
} from 'lucide-react'
import { apiService } from '../../services/api'
import { Loan } from '../../types'

interface MarketplaceFilters {
  status?: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  minAmount?: number
  maxAmount?: number
}

const AdminMarketplace = () => {
  const [filters, setFilters] = useState<MarketplaceFilters>({
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Fetch marketplace loans (all active NFT-backed loans)
  const { data: marketplaceResponse, isLoading, error } = useQuery(
    ['marketplace-loans', filters],
    () => apiService.getMyLoans(filters), // Will need marketplace-specific endpoint
    {
      staleTime: 30000, // 30 seconds
      cacheTime: 300000 // 5 minutes
    }
  )

  const loans = marketplaceResponse?.data?.loans || []

  // Filter loans by search term
  const filteredLoans = Array.isArray(loans) ? loans.filter((loan: Loan) =>
    loan.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.amount.toString().includes(searchTerm) ||
    loan._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (typeof loan.userId === 'object' && loan.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'funded':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'repaying':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'defaulted':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Activity className="w-4 h-4" />
      case 'funded':
        return <CheckCircle className="w-4 h-4" />
      case 'repaying':
        return <TrendingUp className="w-4 h-4" />
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'defaulted':
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const calculateLTV = (loanAmount: number, collateralValue: number) => {
    return collateralValue > 0 ? ((loanAmount / collateralValue) * 100).toFixed(1) : '0'
  }

  const handleViewDetails = (loan: Loan) => {
    setSelectedLoan(loan)
    setShowDetailsModal(true)
  }

  // Calculate marketplace statistics
  const stats = {
    totalLoans: loans.length,
    activeLoans: loans.filter((l: Loan) => l.status === 'active').length,
    totalValue: loans.reduce((sum: number, l: Loan) => sum + l.amount, 0),
    averageInterestRate: loans.length > 0 
      ? (loans.reduce((sum: number, l: Loan) => sum + l.interestRate, 0) / loans.length).toFixed(2)
      : '0',
    defaultRate: loans.length > 0 
      ? ((loans.filter((l: Loan) => l.status === 'defaulted').length / loans.length) * 100).toFixed(1)
      : '0'
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-red-800">Failed to load marketplace data. Please try again.</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">NFT Loan Marketplace</h1>
        <p className="text-gray-600 mt-2">
          Monitor all active NFT-backed loans and marketplace activity
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Loans</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalLoans}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Loans</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeLoans}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Value</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(stats.totalValue)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Interest</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.averageInterestRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Default Rate</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.defaultRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                status: e.target.value === 'all' ? undefined : e.target.value
              }))}
              className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="funded">Funded</option>
              <option value="repaying">Repaying</option>
              <option value="completed">Completed</option>
              <option value="defaulted">Defaulted</option>
            </select>
          </div>

          {/* Amount Range */}
          <div>
            <input
              type="number"
              placeholder="Min Amount"
              value={filters.minAmount || ''}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                minAmount: e.target.value ? parseFloat(e.target.value) : undefined
              }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
              <option value="interestRate-desc">Highest Interest</option>
              <option value="interestRate-asc">Lowest Interest</option>
            </select>
          </div>
        </div>
      </div>

      {/* Marketplace Loans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          ))
        ) : filteredLoans.length > 0 ? (
          filteredLoans.map((loan: Loan) => (
            <div key={loan._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
              {/* Loan Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {loan.purpose}
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(loan.status)}`}>
                  {getStatusIcon(loan.status)}
                  <span className="ml-1 capitalize">{loan.status}</span>
                </span>
              </div>

              {/* Loan Amount */}
              <div className="mb-4">
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(loan.amount)}
                </p>
                <p className="text-sm text-gray-500">
                  {loan.interestRate}% APR • {loan.termMonths} months
                </p>
              </div>

              {/* Loan Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">LTV Ratio</p>
                  <p className="font-semibold text-gray-900">
                    {loan.collateral?.value 
                      ? `${calculateLTV(loan.amount, loan.collateral.value)}%`
                      : 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(loan.requestDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Collateral Info */}
              {loan.collateral && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center">
                    <Coins className="w-4 h-4 text-gray-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {loan.collateral.type}
                      </p>
                      <p className="text-xs text-gray-600">
                        Value: {formatCurrency(loan.collateral.value || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Borrower Info */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-1" />
                  <span>
                    {typeof loan.userId === 'object' 
                      ? loan.userId?.email?.substring(0, 20) + '...' || 'Unknown'
                      : loan.userId
                    }
                  </span>
                </div>
                {loan.nftTokenId && (
                  <div className="flex items-center text-sm text-blue-600">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    <span>NFT #{loan.nftTokenId}</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleViewDetails(loan)}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <Eye className="w-4 h-4 inline mr-2" />
                View Details
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No marketplace loans found</h3>
            <p className="text-gray-500">
              {searchTerm || filters.status 
                ? 'No loans match your current filters.' 
                : 'No loans are currently available in the marketplace.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Loan Details Modal */}
      {showDetailsModal && selectedLoan && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-medium text-gray-900">Loan Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Loan Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-medium">{formatCurrency(selectedLoan.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Interest Rate:</span>
                        <span className="font-medium">{selectedLoan.interestRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Term:</span>
                        <span className="font-medium">{selectedLoan.termMonths} months</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${getStatusColor(selectedLoan.status)}`}>
                          {getStatusIcon(selectedLoan.status)}
                          <span className="ml-1">{selectedLoan.status}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Purpose</h4>
                    <p className="text-gray-700">{selectedLoan.purpose}</p>
                  </div>
                </div>

                {/* Collateral & NFT Info */}
                <div className="space-y-4">
                  {selectedLoan.collateral && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Collateral</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span className="font-medium">{selectedLoan.collateral.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Value:</span>
                          <span className="font-medium">
                            {formatCurrency(selectedLoan.collateral.value || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">LTV:</span>
                          <span className="font-medium">
                            {calculateLTV(selectedLoan.amount, selectedLoan.collateral.value || 0)}%
                          </span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-700">{selectedLoan.collateral.description}</p>
                      </div>
                    </div>
                  )}

                  {selectedLoan.nftTokenId && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">NFT Information</h4>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center">
                          <ExternalLink className="w-5 h-5 text-blue-600 mr-2" />
                          <div>
                            <p className="font-medium text-blue-900">NFT Token #{selectedLoan.nftTokenId}</p>
                            <p className="text-sm text-blue-700">View on blockchain explorer</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Timeline</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">Created:</span>
                        <span className="ml-auto">{new Date(selectedLoan.requestDate).toLocaleDateString()}</span>
                      </div>
                      {selectedLoan.approvalDate && (
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                          <span className="text-gray-600">Approved:</span>
                          <span className="ml-auto">{new Date(selectedLoan.approvalDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminMarketplace
