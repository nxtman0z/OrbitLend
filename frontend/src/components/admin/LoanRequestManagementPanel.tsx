import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  User,
  Calendar,
  AlertCircle,
  Wallet,
  RefreshCw,
  TrendingUp,
  Users
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { apiService } from '../../services/api'

interface LoanRequest {
  _id: string
  amount: number
  purpose: string
  interestRate: number
  termMonths: number
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'defaulted'
  requestDate: string
  approvalDate?: string
  rejectionDate?: string
  rejectionReason?: string
  collateral?: {
    type: string
    value: number
    description: string
  }
  adminNotes?: string
  nftTokenId?: string
  nftTransactionHash?: string
  user: {
    _id: string
    email: string
    firstName: string
    lastName: string
    walletAddress: string
    kyc?: {
      status: 'pending' | 'approved' | 'rejected'
    }
  }
}

const LoanRequestManagementPanel = () => {
  const queryClient = useQueryClient()
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedLoan, setSelectedLoan] = useState<LoanRequest | null>(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showRejectionModal, setShowRejectionModal] = useState(false)

  // Fetch loan statistics
  const { data: statsResponse, isLoading: statsLoading } = useQuery(
    'loan-stats',
    () => apiService.getAdminStats(),
    {
      refetchInterval: 30000 // Refresh every 30 seconds
    }
  )

  const stats = statsResponse?.data

  // Fetch loan requests
  const { data: loansResponse, isLoading: loansLoading, refetch: refetchLoans } = useQuery(
    ['loan-requests', currentPage, selectedStatus, searchTerm],
    () => apiService.getAdminLoanRequests({
      page: currentPage,
      limit: 20,
      ...(selectedStatus !== 'all' && { status: selectedStatus }),
      ...(searchTerm && { search: searchTerm })
    }),
    {
      keepPreviousData: true,
      refetchInterval: 10000 // Refresh every 10 seconds
    }
  )

  const loansData = loansResponse

  // Approve loan mutation
  const approveLoanMutation = useMutation(
    ({ loanId, data }: { loanId: string; data: any }) => 
      apiService.approveLoanRequest(loanId, data),
    {
      onSuccess: () => {
        toast.success('Loan approved successfully!')
        queryClient.invalidateQueries(['loan-requests'])
        queryClient.invalidateQueries('loan-stats')
        setShowApprovalModal(false)
        setSelectedLoan(null)
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Failed to approve loan')
      }
    }
  )

  // Reject loan mutation
  const rejectLoanMutation = useMutation(
    ({ loanId, data }: { loanId: string; data: any }) => 
      apiService.rejectLoanRequest(loanId, data),
    {
      onSuccess: () => {
        toast.success('Loan rejected successfully!')
        queryClient.invalidateQueries(['loan-requests'])
        queryClient.invalidateQueries('loan-stats')
        setShowRejectionModal(false)
        setSelectedLoan(null)
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Failed to reject loan')
      }
    }
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'approved': return 'text-green-600 bg-green-100'
      case 'rejected': return 'text-red-600 bg-red-100'
      case 'active': return 'text-blue-600 bg-blue-100'
      case 'completed': return 'text-purple-600 bg-purple-100'
      case 'defaulted': return 'text-red-800 bg-red-200'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>
            Loan Request Management
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>
            Review, approve, and manage user loan applications
          </p>
        </div>
        <button
          onClick={() => refetchLoans()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors"
          style={{ 
            borderColor: 'rgb(var(--border-primary))',
            color: 'rgb(var(--text-primary))'
          }}
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-premium rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'rgb(var(--text-secondary))' }}>
                  Total Requests
                </p>
                <p className="text-2xl font-bold mt-1" style={{ color: 'rgb(var(--text-primary))' }}>
                  {stats.totalRequests}
                </p>
              </div>
              <Users className="w-8 h-8" style={{ color: 'rgb(var(--color-primary))' }} />
            </div>
          </div>

          <div className="glass-premium rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'rgb(var(--text-secondary))' }}>
                  Pending Review
                </p>
                <p className="text-2xl font-bold mt-1" style={{ color: 'rgb(var(--text-primary))' }}>
                  {stats.byStatus?.pending?.count || 0}
                </p>
              </div>
              <Clock className="w-8 h-8" style={{ color: 'rgb(var(--color-warning))' }} />
            </div>
          </div>

          <div className="glass-premium rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'rgb(var(--text-secondary))' }}>
                  Approved Today
                </p>
                <p className="text-2xl font-bold mt-1" style={{ color: 'rgb(var(--text-primary))' }}>
                  {stats.byStatus?.approved?.count || 0}
                </p>
              </div>
              <CheckCircle className="w-8 h-8" style={{ color: 'rgb(var(--color-success))' }} />
            </div>
          </div>

          <div className="glass-premium rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'rgb(var(--text-secondary))' }}>
                  Total Value
                </p>
                <p className="text-2xl font-bold mt-1" style={{ color: 'rgb(var(--text-primary))' }}>
                  {formatCurrency(
                    Object.values(stats?.byStatus || {}).reduce((sum: number, status: any) => sum + (status?.totalAmount || 0), 0)
                  )}
                </p>
              </div>
              <TrendingUp className="w-8 h-8" style={{ color: 'rgb(var(--color-accent))' }} />
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="glass-premium rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" 
                    style={{ color: 'rgb(var(--text-muted))' }} />
            <input
              type="text"
              placeholder="Search by user email, name, wallet address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-premium pl-10 w-full"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" style={{ color: 'rgb(var(--text-muted))' }} />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-premium min-w-[150px]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="defaulted">Defaulted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loan Requests Table */}
      <div className="glass-premium rounded-xl overflow-hidden">
        {loansLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" 
                 style={{ borderColor: 'rgb(var(--color-primary))' }}></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: 'rgb(var(--bg-card))' }}>
                    <th className="text-left p-4 font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
                      Borrower
                    </th>
                    <th className="text-left p-4 font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
                      Amount
                    </th>
                    <th className="text-left p-4 font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
                      Purpose
                    </th>
                    <th className="text-left p-4 font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
                      Status
                    </th>
                    <th className="text-left p-4 font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
                      Date
                    </th>
                    <th className="text-left p-4 font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loansData?.data?.loans?.map((loan: LoanRequest) => (
                    <tr key={loan._id} 
                        className="border-t transition-colors hover:bg-opacity-50"
                        style={{ borderColor: 'rgb(var(--border-primary))' }}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center"
                               style={{ backgroundColor: 'rgb(var(--color-primary) / 0.1)' }}>
                            <User className="w-5 h-5" style={{ color: 'rgb(var(--color-primary))' }} />
                          </div>
                          <div>
                            <p className="font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
                              {loan.user.firstName} {loan.user.lastName}
                            </p>
                            <p className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
                              {loan.user.email}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <Wallet className="w-3 h-3" style={{ color: 'rgb(var(--text-muted))' }} />
                              <span className="text-xs font-mono" style={{ color: 'rgb(var(--text-muted))' }}>
                                {loan.user.walletAddress.slice(0, 6)}...{loan.user.walletAddress.slice(-4)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" style={{ color: 'rgb(var(--color-success))' }} />
                          <span className="font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
                            {formatCurrency(loan.amount)}
                          </span>
                        </div>
                        <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>
                          {loan.interestRate}% APR • {loan.termMonths} months
                        </p>
                      </td>
                      <td className="p-4">
                        <span className="capitalize font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
                          {loan.purpose.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(loan.status)}`}>
                          {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" style={{ color: 'rgb(var(--text-muted))' }} />
                          <span className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
                            {formatDate(loan.requestDate)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedLoan(loan)}
                            className="p-2 rounded-lg border transition-colors"
                            style={{ 
                              borderColor: 'rgb(var(--border-primary))',
                              color: 'rgb(var(--color-primary))'
                            }}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {loan.status === 'pending' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedLoan(loan)
                                  setShowApprovalModal(true)
                                }}
                                className="p-2 rounded-lg border border-green-300 text-green-600 hover:bg-green-50 transition-colors"
                                title="Approve Loan"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => {
                                  setSelectedLoan(loan)
                                  setShowRejectionModal(true)
                                }}
                                className="p-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                                title="Reject Loan"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {loansData?.data?.pagination && (
              <div className="flex items-center justify-between p-4 border-t"
                   style={{ borderColor: 'rgb(var(--border-primary))' }}>
                <p className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
                  Showing {((loansData.data.pagination.currentPage - 1) * loansData.data.pagination.limit) + 1} to{' '}
                  {Math.min(
                    loansData.data.pagination.currentPage * loansData.data.pagination.limit,
                    loansData.data.pagination.totalRequests
                  )}{' '}
                  of {loansData.data.pagination.totalRequests} requests
                </p>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      borderColor: 'rgb(var(--border-primary))',
                      color: 'rgb(var(--text-primary))'
                    }}
                  >
                    Previous
                  </button>
                  
                  <span className="px-3 py-2" style={{ color: 'rgb(var(--text-primary))' }}>
                    Page {currentPage} of {loansData.data.pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(prev => 
                      Math.min(loansData.data.pagination.totalPages, prev + 1)
                    )}
                    disabled={currentPage === loansData.data.pagination.totalPages}
                    className="px-3 py-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      borderColor: 'rgb(var(--border-primary))',
                      color: 'rgb(var(--text-primary))'
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Loan Detail Modal */}
      {selectedLoan && !showApprovalModal && !showRejectionModal && (
        <LoanDetailModal 
          loan={selectedLoan} 
          onClose={() => setSelectedLoan(null)}
          onApprove={() => setShowApprovalModal(true)}
          onReject={() => setShowRejectionModal(true)}
        />
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedLoan && (
        <ApprovalModal
          loan={selectedLoan}
          onClose={() => setShowApprovalModal(false)}
          onApprove={(data) => approveLoanMutation.mutate({ loanId: selectedLoan._id, data })}
          isLoading={approveLoanMutation.isLoading}
        />
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedLoan && (
        <RejectionModal
          loan={selectedLoan}
          onClose={() => setShowRejectionModal(false)}
          onReject={(data) => rejectLoanMutation.mutate({ loanId: selectedLoan._id, data })}
          isLoading={rejectLoanMutation.isLoading}
        />
      )}
    </div>
  )
}

// Loan Detail Modal Component
const LoanDetailModal = ({ 
  loan, 
  onClose, 
  onApprove, 
  onReject 
}: { 
  loan: LoanRequest
  onClose: () => void
  onApprove: () => void
  onReject: () => void
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="glass-premium rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b"
             style={{ borderColor: 'rgb(var(--border-primary))' }}>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>
              Loan Request Details
            </h2>
            <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>
              Request ID: {loan._id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'rgb(var(--text-muted))' }}
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Borrower Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
                Borrower Information
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span style={{ color: 'rgb(var(--text-secondary))' }}>Name:</span>
                  <span style={{ color: 'rgb(var(--text-primary))' }}>
                    {loan.user.firstName} {loan.user.lastName}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span style={{ color: 'rgb(var(--text-secondary))' }}>Email:</span>
                  <span style={{ color: 'rgb(var(--text-primary))' }}>{loan.user.email}</span>
                </div>
                
                <div className="flex justify-between">
                  <span style={{ color: 'rgb(var(--text-secondary))' }}>Wallet:</span>
                  <span className="font-mono text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
                    {loan.user.walletAddress}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span style={{ color: 'rgb(var(--text-secondary))' }}>KYC Status:</span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    loan.user.kyc?.status === 'approved' ? 'bg-green-100 text-green-800' :
                    loan.user.kyc?.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {loan.user.kyc?.status || 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* Loan Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
                Loan Details
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span style={{ color: 'rgb(var(--text-secondary))' }}>Amount:</span>
                  <span className="font-semibold" style={{ color: 'rgb(var(--color-success))' }}>
                    {formatCurrency(loan.amount)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span style={{ color: 'rgb(var(--text-secondary))' }}>Interest Rate:</span>
                  <span style={{ color: 'rgb(var(--text-primary))' }}>{loan.interestRate}% APR</span>
                </div>
                
                <div className="flex justify-between">
                  <span style={{ color: 'rgb(var(--text-secondary))' }}>Term:</span>
                  <span style={{ color: 'rgb(var(--text-primary))' }}>{loan.termMonths} months</span>
                </div>
                
                <div className="flex justify-between">
                  <span style={{ color: 'rgb(var(--text-secondary))' }}>Purpose:</span>
                  <span className="capitalize" style={{ color: 'rgb(var(--text-primary))' }}>
                    {loan.purpose.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span style={{ color: 'rgb(var(--text-secondary))' }}>Status:</span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    loan.status === 'approved' ? 'bg-green-100 text-green-800' :
                    loan.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    loan.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span style={{ color: 'rgb(var(--text-secondary))' }}>Request Date:</span>
                  <span style={{ color: 'rgb(var(--text-primary))' }}>
                    {formatDate(loan.requestDate)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Collateral Information */}
          {loan.collateral && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
                Collateral Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>Type:</span>
                  <p className="font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
                    {loan.collateral.type}
                  </p>
                </div>
                
                <div>
                  <span className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>Value:</span>
                  <p className="font-medium" style={{ color: 'rgb(var(--color-success))' }}>
                    {formatCurrency(loan.collateral.value)}
                  </p>
                </div>
                
                <div>
                  <span className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>Description:</span>
                  <p className="font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
                    {loan.collateral.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Admin Notes */}
          {loan.adminNotes && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
                Admin Notes
              </h3>
              <p className="p-3 rounded-lg" 
                 style={{ 
                   backgroundColor: 'rgb(var(--bg-card))',
                   color: 'rgb(var(--text-primary))'
                 }}>
                {loan.adminNotes}
              </p>
            </div>
          )}

          {/* Rejection Reason */}
          {loan.rejectionReason && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-red-600">
                Rejection Reason
              </h3>
              <p className="p-3 rounded-lg bg-red-50 text-red-800">
                {loan.rejectionReason}
              </p>
            </div>
          )}

          {/* NFT Information */}
          {loan.nftTokenId && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
                NFT Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>Token ID:</span>
                  <p className="font-mono" style={{ color: 'rgb(var(--text-primary))' }}>
                    {loan.nftTokenId}
                  </p>
                </div>
                
                {loan.nftTransactionHash && (
                  <div>
                    <span className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>Transaction Hash:</span>
                    <p className="font-mono text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
                      {loan.nftTransactionHash}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {loan.status === 'pending' && (
            <div className="flex items-center gap-4 pt-6 border-t"
                 style={{ borderColor: 'rgb(var(--border-primary))' }}>
              <button
                onClick={onApprove}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                Approve Loan
              </button>
              
              <button
                onClick={onReject}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <XCircle className="w-5 h-5" />
                Reject Loan
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Approval Modal Component
const ApprovalModal = ({ 
  loan, 
  onClose, 
  onApprove, 
  isLoading 
}: { 
  loan: LoanRequest
  onClose: () => void
  onApprove: (data: any) => void
  isLoading: boolean
}) => {
  const [adminNotes, setAdminNotes] = useState('')
  const [adjustedInterestRate, setAdjustedInterestRate] = useState(loan.interestRate)
  const [adjustedTermMonths, setAdjustedTermMonths] = useState(loan.termMonths)

  const handleApprove = () => {
    onApprove({
      adminNotes: adminNotes || undefined,
      adjustedInterestRate: adjustedInterestRate !== loan.interestRate ? adjustedInterestRate : undefined,
      adjustedTermMonths: adjustedTermMonths !== loan.termMonths ? adjustedTermMonths : undefined
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="glass-premium rounded-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b"
             style={{ borderColor: 'rgb(var(--border-primary))' }}>
          <div>
            <h2 className="text-xl font-bold text-green-600">
              Approve Loan Request
            </h2>
            <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>
              {loan.user.firstName} {loan.user.lastName} - {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(loan.amount)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'rgb(var(--text-muted))' }}
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Loan Terms Adjustment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-primary))' }}>
                Interest Rate (APR)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="50"
                value={adjustedInterestRate}
                onChange={(e) => setAdjustedInterestRate(parseFloat(e.target.value))}
                className="input-premium w-full"
                placeholder="Interest rate"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-primary))' }}>
                Term (Months)
              </label>
              <input
                type="number"
                min="1"
                max="360"
                value={adjustedTermMonths}
                onChange={(e) => setAdjustedTermMonths(parseInt(e.target.value))}
                className="input-premium w-full"
                placeholder="Term in months"
              />
            </div>
          </div>

          {/* Admin Notes */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-primary))' }}>
              Admin Notes (Optional)
            </label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
              className="input-premium w-full resize-none"
              placeholder="Add any notes about this approval..."
            />
          </div>

          {/* Warning Message */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
            <AlertCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-green-800">Approval will trigger:</p>
              <ul className="mt-1 text-green-700 space-y-1">
                <li>• NFT minting with loan details</li>
                <li>• Notification to borrower</li>
                <li>• Loan status change to "Active"</li>
                <li>• Blockchain transaction recording</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-3 rounded-lg border transition-colors"
              style={{ 
                borderColor: 'rgb(var(--border-primary))',
                color: 'rgb(var(--text-primary))'
              }}
            >
              Cancel
            </button>
            
            <button
              onClick={handleApprove}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Approve & Mint NFT
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Rejection Modal Component
const RejectionModal = ({ 
  loan, 
  onClose, 
  onReject, 
  isLoading 
}: { 
  loan: LoanRequest
  onClose: () => void
  onReject: (data: any) => void
  isLoading: boolean
}) => {
  const [rejectionReason, setRejectionReason] = useState('')
  const [adminNotes, setAdminNotes] = useState('')

  const handleReject = () => {
    if (rejectionReason.trim().length < 10) {
      toast.error('Rejection reason must be at least 10 characters')
      return
    }

    onReject({
      rejectionReason: rejectionReason.trim(),
      adminNotes: adminNotes || undefined
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="glass-premium rounded-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b"
             style={{ borderColor: 'rgb(var(--border-primary))' }}>
          <div>
            <h2 className="text-xl font-bold text-red-600">
              Reject Loan Request
            </h2>
            <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>
              {loan.user.firstName} {loan.user.lastName} - {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(loan.amount)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'rgb(var(--text-muted))' }}
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Rejection Reason */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-primary))' }}>
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="input-premium w-full resize-none"
              placeholder="Please provide a clear reason for rejecting this loan request (minimum 10 characters)..."
              required
            />
            <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-muted))' }}>
              {rejectionReason.length}/10 characters minimum
            </p>
          </div>

          {/* Admin Notes */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-primary))' }}>
              Internal Admin Notes (Optional)
            </label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              className="input-premium w-full resize-none"
              placeholder="Add any internal notes about this rejection..."
            />
          </div>

          {/* Warning Message */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-red-800">Rejection will:</p>
              <ul className="mt-1 text-red-700 space-y-1">
                <li>• Notify the borrower immediately</li>
                <li>• Change loan status to "Rejected"</li>
                <li>• Record rejection reason and timestamp</li>
                <li>• Cannot be undone after confirmation</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-3 rounded-lg border transition-colors"
              style={{ 
                borderColor: 'rgb(var(--border-primary))',
                color: 'rgb(var(--text-primary))'
              }}
            >
              Cancel
            </button>
            
            <button
              onClick={handleReject}
              disabled={isLoading || rejectionReason.trim().length < 10}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5" />
                  Confirm Rejection
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoanRequestManagementPanel
