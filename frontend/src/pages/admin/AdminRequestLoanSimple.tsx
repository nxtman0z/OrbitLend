import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { toast } from 'react-hot-toast'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Search,
  Eye,
  User
} from 'lucide-react'
import { apiService } from '../../services/api'

// Type definitions
interface LoanRequest {
  _id: string
  user: {
    _id: string
    firstName: string
    lastName: string
    email: string
    walletAddress: string
    kyc?: {
      status: string
    }
  }
  amount: number
  purpose: string
  interestRate: number
  termMonths: number
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed'
  createdAt: string
  collateral?: {
    type: string
    value: number
    description: string
  }
  adminNotes?: string
  rejectionReason?: string
}

interface LoanStats {
  totalRequests: number
  byStatus: {
    [key: string]: {
      count: number
      totalAmount: number
    }
  }
  recentRequests: LoanRequest[]
}

const AdminRequestLoanSimple = () => {
  const queryClient = useQueryClient()
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLoan, setSelectedLoan] = useState<LoanRequest | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [page, setPage] = useState(1)
  const [rejectionReason, setRejectionReason] = useState('')
  const [adminNotes, setAdminNotes] = useState('')

  // Fetch loan requests
  const { 
    data: loansData, 
    isLoading: isLoadingLoans,
    refetch: refetchLoans 
  } = useQuery(
    ['admin-loan-requests', page, selectedStatus, searchTerm],
    async () => {
      console.log('Fetching admin loan requests...')
      const response = await apiService.getAdminLoanRequests({
        page,
        limit: 10,
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(searchTerm && { search: searchTerm })
      })
      console.log('Admin loan requests response:', response)
      return response
    },
    {
      keepPreviousData: true,
      retry: 3,
      refetchInterval: 10000,
      onError: (error) => {
        console.error('Query error:', error)
        toast.error('Failed to load loan requests')
      }
    }
  )

  // Fetch loan statistics
  const { data: statsData } = useQuery(
    ['admin-loan-stats'],
    async () => {
      console.log('Fetching admin stats...')
      const response = await apiService.getAdminStats()
      console.log('Admin stats response:', response)
      return response
    },
    {
      retry: 3,
      refetchInterval: 30000,
      onError: (error) => {
        console.error('Stats query error:', error)
      }
    }
  )

  // Approve loan mutation
  const approveLoanMutation = useMutation(
    ({ loanId, notes }: { loanId: string; notes?: string }) =>
      apiService.approveLoanRequest(loanId, { notes }),
    {
      onSuccess: () => {
        toast.success('Loan approved successfully!')
        setShowDetailsModal(false)
        setAdminNotes('')
        refetchLoans()
        queryClient.invalidateQueries(['admin-loan-stats'])
      },
      onError: (error: any) => {
        console.error('Approve loan error:', error)
        toast.error(error?.response?.data?.message || 'Failed to approve loan')
      }
    }
  )

  // Reject loan mutation
  const rejectLoanMutation = useMutation(
    ({ loanId, reason, notes }: { loanId: string; reason: string; notes?: string }) =>
      apiService.rejectLoanRequest(loanId, { reason, notes }),
    {
      onSuccess: () => {
        toast.success('Loan rejected')
        setShowDetailsModal(false)
        setRejectionReason('')
        setAdminNotes('')
        refetchLoans()
        queryClient.invalidateQueries(['admin-loan-stats'])
      },
      onError: (error: any) => {
        console.error('Reject loan error:', error)
        toast.error(error?.response?.data?.message || 'Failed to reject loan')
      }
    }
  )

  // Extract data with proper fallbacks
  const loans: LoanRequest[] = loansData?.data?.loans || loansData?.loans || []
  const pagination = loansData?.data?.pagination || { totalPages: 1, totalLoans: 0 }
  const stats: LoanStats = statsData?.data || statsData || {
    totalRequests: 0,
    byStatus: {},
    recentRequests: []
  }

  console.log('AdminRequestLoan - Current data:', {
    loansCount: loans.length,
    pagination,
    stats,
    isLoading: isLoadingLoans
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'approved':
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleViewDetails = async (loanId: string) => {
    try {
      const response = await apiService.getLoanRequestDetails(loanId)
      setSelectedLoan(response.data)
      setShowDetailsModal(true)
    } catch (error) {
      toast.error('Failed to fetch loan details')
    }
  }

  const handleApprove = () => {
    if (!selectedLoan) return
    approveLoanMutation.mutate({
      loanId: selectedLoan._id,
      notes: adminNotes || undefined
    })
  }

  const handleReject = () => {
    if (!selectedLoan || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    rejectLoanMutation.mutate({
      loanId: selectedLoan._id,
      reason: rejectionReason,
      notes: adminNotes || undefined
    })
  }

  // Demo loan creation function
  const createDemoLoan = async () => {
    try {
      const authData = localStorage.getItem('auth-storage')
      const token = authData ? JSON.parse(authData).state?.token : ''
      
      await fetch('/api/loans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: Math.floor(Math.random() * 10000) + 1000,
          purpose: ['business', 'personal', 'education', 'medical'][Math.floor(Math.random() * 4)],
          interestRate: Math.floor(Math.random() * 10) + 5,
          termMonths: [12, 24, 36, 48][Math.floor(Math.random() * 4)],
          collateral: {
            type: 'Property',
            value: Math.floor(Math.random() * 50000) + 10000,
            description: 'Demo collateral for testing'
          }
        })
      })
      toast.success('Demo loan request created!')
      refetchLoans()
    } catch (error) {
      console.error('Error creating demo loan:', error)
      toast.error('Failed to create demo loan')
    }
  }

  // Show loading state
  if (isLoadingLoans) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading loan requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Loan Request Management</h1>
          <p className="text-gray-600 mt-1">Review, approve, and manage user loan applications</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetchLoans()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={createDemoLoan}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Create Demo Loan
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalRequests || loans.length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats?.byStatus?.pending?.count || 
                 loans.filter(loan => loan.status === 'pending').length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">
                {(stats?.byStatus?.approved?.count || 0) + 
                 (stats?.byStatus?.active?.count || 0) ||
                 loans.filter(loan => loan.status === 'approved' || loan.status === 'active').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">
                {stats?.byStatus?.rejected?.count || 
                 loans.filter(loan => loan.status === 'rejected').length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by email, name, wallet address..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-48">
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="active">Active</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Loan Requests</h2>
          <p className="text-gray-600 mt-1">
            {loans.length > 0 
              ? `Showing ${loans.length} loan requests`
              : 'No loan requests found'
            }
          </p>
        </div>

        {loans.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No loan requests</h3>
            <p className="text-gray-600 mb-4">
              {selectedStatus !== 'all' 
                ? `No ${selectedStatus} loan requests found`
                : 'No loan requests found. Try creating a demo loan to test the system.'
              }
            </p>
            <button
              onClick={createDemoLoan}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Demo Loan
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount & Terms
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purpose
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loans.map((loan) => (
                  <tr key={loan._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <User className="h-6 w-6 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {loan.user.firstName} {loan.user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{loan.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {loan.amount.toLocaleString()} ETH
                      </div>
                      <div className="text-sm text-gray-500">
                        {loan.interestRate}% APR • {loan.termMonths}mo
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">
                        {loan.purpose.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(loan.status)}`}>
                        {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(loan.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(loan._id)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {loan.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedLoan(loan)
                              setShowDetailsModal(true)
                            }}
                            className="text-green-600 hover:text-green-900 mr-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedLoan(loan)
                              setShowDetailsModal(true)
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing page {page} of {pagination.totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
              disabled={page === pagination.totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Loan Details Modal */}
      {showDetailsModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Loan Request Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* User Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">User Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium">{selectedLoan.user.firstName} {selectedLoan.user.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{selectedLoan.user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Wallet Address</p>
                      <p className="font-medium text-xs break-all">{selectedLoan.user.walletAddress}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">KYC Status</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedLoan.user.kyc?.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedLoan.user.kyc?.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Loan Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Loan Details</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Amount Requested</p>
                      <p className="font-medium">{selectedLoan.amount.toLocaleString()} ETH</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Interest Rate</p>
                      <p className="font-medium">{selectedLoan.interestRate}% APR</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Term</p>
                      <p className="font-medium">{selectedLoan.termMonths} months</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Purpose</p>
                      <p className="font-medium capitalize">{selectedLoan.purpose.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Collateral Information */}
              {selectedLoan.collateral && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Collateral Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Type</p>
                      <p className="font-medium">{selectedLoan.collateral.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Value</p>
                      <p className="font-medium">${selectedLoan.collateral.value.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Description</p>
                      <p className="font-medium">{selectedLoan.collateral.description}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Admin Notes</h3>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Add notes about this loan request..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>

              {/* Rejection Reason (if rejecting) */}
              {selectedLoan.status === 'pending' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Rejection Reason</h3>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Provide reason for rejection (if applicable)..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {selectedLoan.status === 'pending' && (
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={rejectLoanMutation.isLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {rejectLoanMutation.isLoading ? 'Rejecting...' : 'Reject'}
                </button>
                <button
                  onClick={handleApprove}
                  disabled={approveLoanMutation.isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {approveLoanMutation.isLoading ? 'Approving...' : 'Approve'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminRequestLoanSimple
