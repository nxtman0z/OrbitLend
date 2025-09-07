import { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  DollarSign,
  Calendar,
  FileText,
  AlertCircle
} from 'lucide-react'
import { apiService } from '../services/api'

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
  nftTokenId?: string
  nftTransactionHash?: string
}

const UserLoanRequests = () => {
  const [selectedLoan, setSelectedLoan] = useState<LoanRequest | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Fetch user's loan requests
  const { data: loansData, isLoading } = useQuery(
    'my-loans',
    () => apiService.getMyLoans({ page: 1, limit: 50 }),
    {
      refetchInterval: 30000 // Refresh every 30 seconds
    }
  )

  // WebSocket connection for real-time updates
  const [isConnected, setIsConnected] = useState(false)
  
  // For now, we'll use polling instead of WebSocket for simplicity
  useEffect(() => {
    // Simulate WebSocket connection status
    setIsConnected(true)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'approved':
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
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

  const loans = loansData?.data?.loans || []

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">My Loan Requests</h2>
          </div>
          <div className="flex items-center">
            {isConnected ? (
              <div className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm">Live Updates</span>
              </div>
            ) : (
              <div className="flex items-center text-gray-500">
                <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                <span className="text-sm">Offline</span>
              </div>
            )}
          </div>
        </div>

        {loans.length === 0 ? (
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No loan requests yet</p>
            <p className="text-sm text-gray-400">Submit your first loan request to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {loans.map((loan: LoanRequest) => (
              <div key={loan._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(loan.status)}
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {formatCurrency(loan.amount)}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${getStatusColor(loan.status)}`}>
                          {loan.status}
                        </span>
                      </div>
                      <p className="text-gray-600 capitalize">{loan.purpose.replace('_', ' ')}</p>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        Requested on {formatDate(loan.requestDate)}
                        {loan.approvalDate && (
                          <span className="ml-3">• Approved on {formatDate(loan.approvalDate)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{loan.interestRate}% APR</p>
                      <p className="text-sm text-gray-500">{loan.termMonths} months</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedLoan(loan)
                        setShowDetails(true)
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Quick status info */}
                {loan.status === 'rejected' && loan.rejectionReason && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>Rejection Reason:</strong> {loan.rejectionReason}
                    </p>
                  </div>
                )}

                {loan.status === 'approved' && loan.nftTokenId && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>NFT Minted:</strong> Token ID #{loan.nftTokenId}
                      {loan.nftTransactionHash && (
                        <span className="ml-2">
                          • <a 
                            href={`https://sepolia.etherscan.io/tx/${loan.nftTransactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 underline hover:text-green-800"
                          >
                            View Transaction
                          </a>
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Loan Details Modal */}
      {showDetails && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Loan Request Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center space-x-3">
                  {getStatusIcon(selectedLoan.status)}
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border capitalize ${getStatusColor(selectedLoan.status)}`}>
                    {selectedLoan.status}
                  </span>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Loan Amount</label>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(selectedLoan.amount)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Purpose</label>
                    <p className="text-gray-900 capitalize">{selectedLoan.purpose.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Interest Rate</label>
                    <p className="text-gray-900">{selectedLoan.interestRate}% APR</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Term</label>
                    <p className="text-gray-900">{selectedLoan.termMonths} months</p>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Request Date</label>
                    <p className="text-gray-900">{formatDate(selectedLoan.requestDate)}</p>
                  </div>
                  {selectedLoan.approvalDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Approval Date</label>
                      <p className="text-gray-900">{formatDate(selectedLoan.approvalDate)}</p>
                    </div>
                  )}
                  {selectedLoan.rejectionDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Rejection Date</label>
                      <p className="text-gray-900">{formatDate(selectedLoan.rejectionDate)}</p>
                    </div>
                  )}
                </div>

                {/* Collateral */}
                {selectedLoan.collateral && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Collateral</label>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Type:</span>
                          <p className="text-gray-900">{selectedLoan.collateral.type}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Value:</span>
                          <p className="text-gray-900">{formatCurrency(selectedLoan.collateral.value)}</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Description:</span>
                        <p className="text-gray-900 mt-1">{selectedLoan.collateral.description}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* NFT Info */}
                {selectedLoan.nftTokenId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">NFT Details</label>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-green-800">
                        <strong>Token ID:</strong> #{selectedLoan.nftTokenId}
                      </p>
                      {selectedLoan.nftTransactionHash && (
                        <p className="text-green-800 mt-1">
                          <strong>Transaction:</strong>{' '}
                          <a 
                            href={`https://sepolia.etherscan.io/tx/${selectedLoan.nftTransactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 underline hover:text-green-800"
                          >
                            View on Etherscan
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Rejection Reason */}
                {selectedLoan.rejectionReason && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason</label>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-red-800">{selectedLoan.rejectionReason}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default UserLoanRequests
