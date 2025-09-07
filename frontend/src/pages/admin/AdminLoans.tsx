import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText,
  Eye,
  AlertCircle,
  TrendingUp,
  Filter,
  Search,
  Coins,
  Calendar,
  User
} from 'lucide-react'
import { Loan, LoanFilters } from '../../types'
import { apiService } from '../../services/api'
import { toast } from 'react-hot-toast'

const AdminLoans = () => {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<LoanFilters>({
    status: undefined,
    sortBy: 'requestDate',
    sortOrder: 'desc'
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvalData, setApprovalData] = useState({
    approved: true,
    rejectionReason: '',
    fundingAmount: 0
  })

  // Fetch all loan requests (admin view)
  const { data: loansResponse, isLoading, error } = useQuery(
    ['admin-loans', filters],
    () => apiService.getMyLoans(filters), // Using existing endpoint for now
    {
      staleTime: 10000, // 10 seconds
      cacheTime: 300000 // 5 minutes
    }
  )

  // Loan approval/rejection mutation
  const loanDecisionMutation = useMutation(
    ({ decision }: { loanId: string, decision: any }) => 
      apiService.requestLoan(decision), // Placeholder - will need admin-specific endpoint
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-loans'])
        toast.success('Loan decision submitted successfully!')
        setShowApprovalModal(false)
        setSelectedLoan(null)
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Failed to update loan status')
      }
    }
  )

  const loans = loansResponse?.data?.loans || []
  const totalLoans = loansResponse?.data?.pagination?.totalLoans || 0

  // Filter loans by search term
  const filteredLoans = Array.isArray(loans) ? loans.filter((loan: Loan) =>
    loan.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.amount.toString().includes(searchTerm) ||
    loan._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (typeof loan.userId === 'object' && loan.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()))
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

  const handleLoanAction = (loan: Loan, action: 'approve' | 'reject') => {
    setSelectedLoan(loan)
    setApprovalData({
      approved: action === 'approve',
      rejectionReason: '',
      fundingAmount: action === 'approve' ? loan.amount : 0
    })
    setShowApprovalModal(true)
  }

  const submitLoanDecision = () => {
    if (!selectedLoan) return

    const decision = {
      status: approvalData.approved ? 'approved' : 'rejected',
      rejectionReason: approvalData.approved ? undefined : approvalData.rejectionReason,
      fundingAmount: approvalData.approved ? approvalData.fundingAmount : undefined
    }

    loanDecisionMutation.mutate({ 
      loanId: selectedLoan._id, 
      decision 
    })
  }

  // Calculate summary statistics
  const stats = {
    total: totalLoans,
    pending: loans.filter((l: Loan) => l.status === 'pending').length,
    approved: loans.filter((l: Loan) => l.status === 'approved').length,
    active: loans.filter((l: Loan) => l.status === 'active').length,
    rejected: loans.filter((l: Loan) => l.status === 'rejected').length,
    totalPendingAmount: loans
      .filter((l: Loan) => l.status === 'pending')
      .reduce((sum: number, l: Loan) => sum + l.amount, 0),
    totalApprovedAmount: loans
      .filter((l: Loan) => ['approved', 'active'].includes(l.status))
      .reduce((sum: number, l: Loan) => sum + l.amount, 0)
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-red-800">Failed to load loan requests. Please try again.</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Loan Management</h1>
        <p className="text-gray-600 mt-2">
          Review, approve, and manage all loan requests across the platform
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Approval</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
              <p className="text-sm text-gray-600">{formatCurrency(stats.totalPendingAmount)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Approved Loans</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.approved}</p>
              <p className="text-sm text-gray-600">{formatCurrency(stats.totalApprovedAmount)}</p>
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
            <XCircle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Rejected</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.rejected}</p>
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
              placeholder="Search loans, users..."
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
                status: e.target.value === 'all' ? undefined : e.target.value as LoanFilters['status']
              }))}
              className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending Approval</option>
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
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold text-gray-900 mr-4">
                          {loan.purpose}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(loan.status)}`}>
                          {getStatusIcon(loan.status)}
                          <span className="ml-1 capitalize">{loan.status}</span>
                        </span>
                      </div>
                      
                      {/* Action buttons for pending loans */}
                      {loan.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleLoanAction(loan, 'approve')}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleLoanAction(loan, 'reject')}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* User Information */}
                    <div className="flex items-center mb-3 text-sm text-gray-600">
                      <User className="w-4 h-4 mr-1" />
                      <span>
                        {typeof loan.userId === 'object' 
                          ? loan.userId?.email || 'Unknown User'
                          : loan.userId
                        }
                      </span>
                      <Calendar className="w-4 h-4 ml-4 mr-1" />
                      <span>{new Date(loan.requestDate).toLocaleDateString()}</span>
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
                        <p className="text-sm text-gray-500">Collateral Value</p>
                        <p className="font-semibold text-gray-900">
                          {loan.collateral?.value ? formatCurrency(loan.collateral.value) : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Collateral Information */}
                    {loan.collateral && (
                      <div className="bg-blue-50 rounded-lg p-3 mb-4">
                        <div className="flex items-center">
                          <div className="bg-blue-100 rounded-full p-2 mr-3">
                            <Coins className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-blue-900">
                              Collateral: {loan.collateral.type}
                            </p>
                            <p className="text-xs text-blue-700 mt-1 line-clamp-2">
                              {loan.collateral.description}
                            </p>
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
                    <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No loan requests found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filters.status 
                ? 'No loans match your current filters.' 
                : 'No loan requests have been submitted yet.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Approval/Rejection Modal */}
      {showApprovalModal && selectedLoan && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {approvalData.approved ? 'Approve Loan Request' : 'Reject Loan Request'}
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Loan: {selectedLoan.purpose} - {formatCurrency(selectedLoan.amount)}
                </p>
                <p className="text-sm text-gray-600">
                  User: {typeof selectedLoan.userId === 'object' 
                    ? selectedLoan.userId?.email 
                    : selectedLoan.userId}
                </p>
              </div>

              {approvalData.approved ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Funding Amount
                    </label>
                    <input
                      type="number"
                      value={approvalData.fundingAmount}
                      onChange={(e) => setApprovalData(prev => ({
                        ...prev,
                        fundingAmount: parseFloat(e.target.value) || 0
                      }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter funding amount"
                    />
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <p className="text-sm text-green-700">
                      Approving this loan will automatically mint an NFT and transfer funds to the borrower.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason
                  </label>
                  <textarea
                    value={approvalData.rejectionReason}
                    onChange={(e) => setApprovalData(prev => ({
                      ...prev,
                      rejectionReason: e.target.value
                    }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter reason for rejection..."
                  />
                </div>
              )}

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={submitLoanDecision}
                  disabled={loanDecisionMutation.isLoading}
                  className={`flex-1 px-4 py-2 text-white rounded-md font-medium ${
                    approvalData.approved 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-50`}
                >
                  {loanDecisionMutation.isLoading ? 'Processing...' : 
                   approvalData.approved ? 'Approve & Fund' : 'Reject'}
                </button>
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminLoans
