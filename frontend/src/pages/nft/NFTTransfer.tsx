import { useState } from 'react'
import { useMutation, useQuery } from 'react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { 
  Send, 
  Wallet, 
  ArrowRightLeft, 
  Eye, 
  Shield,
  AlertCircle,
  CheckCircle,
  ExternalLink
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import apiService from '../../services/api'

const transferSchema = z.object({
  nftTokenId: z.string().min(1, 'Please select an NFT'),
  transferType: z.enum(['deposit', 'withdraw']),
  walletAddress: z.string().min(1, 'Wallet address is required').optional(),
  reason: z.string().optional()
})

type TransferFormData = z.infer<typeof transferSchema>

const NFTTransfer = () => {
  const [selectedTab, setSelectedTab] = useState<'deposit' | 'withdraw'>('deposit')
  const { user } = useAuthStore()
  const isKycVerified = user?.kycStatus === 'approved'

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      transferType: selectedTab
    }
  })

  // Fetch user's NFTs from portfolio
  const { data: portfolioResponse } = useQuery(
    ['user-nfts-portfolio'],
    () => apiService.getMyNFTPortfolio(1, 50),
    {
      enabled: isKycVerified
    }
  )
  const userNFTs = portfolioResponse?.data.nfts || []

  // Mock transfer history for now (will be implemented in backend)
  const transferHistory: any[] = []
  const historyLoading = false

    const transferMutation = useMutation(
    (_data: TransferFormData) => {
      // This will be implemented with actual NFT transfer logic
      return Promise.resolve({ success: true })
    },
    {
      onSuccess: () => {
        toast.success('NFT transfer initiated successfully!')
        // Reset form or redirect
      },
      onError: (_error: any) => {
        toast.error('Failed to transfer NFT. Please try again.')
      }
    }
  )

  const onSubmit = (data: TransferFormData) => {
    transferMutation.mutate({ ...data, transferType: selectedTab })
  }

  const selectedNftId = watch('nftTokenId')
  const selectedNft = userNFTs.find((nft: any) => nft.tokenId === selectedNftId)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">NFT Vault Transfer</h1>
        <p className="text-gray-600 mt-2">
          Securely transfer NFTs between your wallet and OrbitLend vault
        </p>
      </div>

      {/* KYC Verification Alert */}
      {!isKycVerified && (
        <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800 font-medium">
              Complete your KYC verification to enable NFT transfers
            </span>
            <a
              href="/kyc"
              className="ml-auto text-yellow-700 hover:text-yellow-900 font-medium"
            >
              Verify Now →
            </a>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transfer Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Tab Selection */}
            <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setSelectedTab('deposit')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  selectedTab === 'deposit'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Send className="h-4 w-4 inline mr-2" />
                Deposit to Vault
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab('withdraw')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  selectedTab === 'withdraw'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Wallet className="h-4 w-4 inline mr-2" />
                Withdraw to Wallet
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* NFT Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select NFT *
                </label>
                <select
                  {...register('nftTokenId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!isKycVerified}
                >
                  <option value="">Choose an NFT</option>
                  {userNFTs
                    .filter((nft: any) => 
                      selectedTab === 'deposit' ? nft.marketplaceStatus !== 'sold' : nft.isActive
                    )
                    .map((nft: any) => (
                                        <option key={nft.tokenId} value={nft.tokenId}>
                    {nft.metadata.name} #{nft.tokenId}
                  </option>
                    ))}
                </select>
                {errors.nftTokenId && (
                  <p className="mt-1 text-sm text-red-600">{errors.nftTokenId.message}</p>
                )}
              </div>

              {/* Destination Wallet (for withdrawals) */}
              {selectedTab === 'withdraw' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destination Wallet Address *
                  </label>
                  <input
                    {...register('walletAddress')}
                    type="text"
                    placeholder="0x..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!isKycVerified}
                  />
                  {errors.walletAddress && (
                    <p className="mt-1 text-sm text-red-600">{errors.walletAddress.message}</p>
                  )}
                </div>
              )}

              {/* Transfer Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  {...register('reason')}
                  rows={3}
                  placeholder="Optional reason for this transfer..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!isKycVerified}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={transferMutation.isLoading || !isKycVerified}
                className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {transferMutation.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    {selectedTab === 'deposit' ? 'Deposit NFT' : 'Withdraw NFT'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Selected NFT Preview & Info */}
        <div className="space-y-6">
          {/* NFT Preview */}
          {selectedNft && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Selected NFT</h3>
              <div className="space-y-4">
                {selectedNft.metadata.image && (
                  <img
                    src={selectedNft.metadata.image}
                    alt={selectedNft.metadata.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}
                <div>
                  <h4 className="font-semibold text-gray-900">{selectedNft.metadata.name}</h4>
                  <p className="text-sm text-gray-600">Token ID: #{selectedNft.tokenId}</p>
                  <p className="text-sm text-gray-600">
                    Contract: {selectedNft.contractAddress}
                  </p>
                  <p className="text-sm text-gray-600">
                    Status: {selectedNft.metadata.loanDetails.status}
                  </p>
                </div>
                <div className="flex items-center">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    selectedNft.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedNft.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <a
                  href={selectedNft.explorerUrl || `https://etherscan.io/token/${selectedNft.contractAddress}?a=${selectedNft.tokenId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  View on Explorer
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </div>
          )}

          {/* Transfer Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Transfer Info</h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <Shield className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-gray-600">Secure vault storage</span>
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-gray-600">Insurance coverage</span>
              </div>
              <div className="flex items-center text-sm">
                <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                <span className="text-gray-600">Gas fees apply</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer History */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Transfer History</h3>
        
        {historyLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : transferHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">NFT</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transferHistory.slice(0, 5).map((transfer: any) => (
                  <tr key={transfer._id} className="border-b border-gray-100">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{transfer.nftName}</p>
                        <p className="text-sm text-gray-600">#{transfer.tokenId}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        transfer.type === 'deposit' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {transfer.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        transfer.status === 'completed' ? 'bg-green-100 text-green-800' :
                        transfer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {transfer.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(transfer.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      {transfer.transactionHash && (
                        <a
                          href={`https://etherscan.io/tx/${transfer.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <ArrowRightLeft className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No transfer history yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default NFTTransfer
