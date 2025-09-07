import { useState } from 'react'
import { useQuery } from 'react-query'
import { apiService } from '../../services/api'
import { NFTLoan } from '../../types'
import { 
  TrendingUp, 
  DollarSign, 
  Coins, 
  Star, 
  Eye, 
  ExternalLink,
  Filter,
  Grid,
  List,
  RefreshCw
} from 'lucide-react'
import { Link } from 'react-router-dom'

const Portfolio = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterBy, setFilterBy] = useState<'all' | 'active' | 'repaid' | 'defaulted'>('all')
  const [sortBy, setSortBy] = useState<'value' | 'date' | 'alphabetical'>('value')

  // Fetch NFT Portfolio from Verbwire integration
  const { data: nftPortfolio, isLoading: nftLoading, error: nftError, refetch: refetchNFTs } = useQuery(
    ['nft-portfolio'],
    () => apiService.getMyNFTPortfolio(),
    {
      refetchInterval: 60000, // Refresh every minute
    }
  )

  // Fetch loan portfolio
  const { data: loanPortfolio, isLoading: loanLoading, error: loanError } = useQuery(
    ['loan-portfolio'],
    () => apiService.getMyLoans(),
    {
      refetchInterval: 30000,
    }
  )

  const nfts = nftPortfolio?.data?.loans || []
  const loans = loanPortfolio?.data?.loans || []

  // Filter NFTs based on loan status
  const filteredNFTs = nfts.filter((nft: NFTLoan) => {
    if (filterBy === 'all') return true
    if (!nft.metadata?.loanDetails) return false
    
    const status = nft.metadata.loanDetails.status
    switch (filterBy) {
      case 'active':
        return status === 'funded' || status === 'approved'
      case 'repaid':
        return status === 'completed'
      case 'defaulted':
        return status === 'defaulted'
      default:
        return true
    }
  })

  // Sort NFTs
  const sortedNFTs = [...filteredNFTs].sort((a, b) => {
    switch (sortBy) {
      case 'value':
        return (b.metadata?.loanDetails?.amount || 0) - (a.metadata?.loanDetails?.amount || 0)
      case 'date':
        return new Date(b.metadata?.loanDetails?.approvalDate || 0).getTime() - 
               new Date(a.metadata?.loanDetails?.approvalDate || 0).getTime()
      case 'alphabetical':
        return a.metadata?.name.localeCompare(b.metadata?.name || '') || 0
      default:
        return 0
    }
  })

  // Calculate portfolio stats
  const portfolioStats = {
    totalNFTs: nfts.length,
    totalValue: nfts.reduce((sum, nft) => sum + (nft.metadata?.loanDetails?.amount || 0), 0),
    activeLoans: nfts.filter(nft => nft.metadata?.loanDetails?.status === 'funded').length,
    totalEarnings: loans.filter(loan => loan.status === 'completed')
                       .reduce((sum, loan) => sum + (loan.amount * loan.interestRate / 100), 0)
  }

  const isLoading = nftLoading || loanLoading
  const hasError = nftError || loanError

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-64 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Failed to load portfolio data. Please try again later.</p>
          <button 
            onClick={() => { refetchNFTs() }}
            className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Portfolio</h1>
          <p className="text-gray-600">Manage your NFT collateral and loan portfolio</p>
        </div>
        <button
          onClick={() => refetchNFTs()}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total NFTs</p>
              <p className="text-2xl font-bold">{portfolioStats.totalNFTs}</p>
            </div>
            <Coins className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Portfolio Value</p>
              <p className="text-2xl font-bold">{portfolioStats.totalValue.toFixed(2)} ETH</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Active Loans</p>
              <p className="text-2xl font-bold">{portfolioStats.activeLoans}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Total Earnings</p>
              <p className="text-2xl font-bold">{portfolioStats.totalEarnings.toFixed(2)} ETH</p>
            </div>
            <Star className="h-8 w-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All NFTs</option>
                <option value="active">Active Loans</option>
                <option value="repaid">Repaid Loans</option>
                <option value="defaulted">Defaulted</option>
              </select>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="value">Sort by Value</option>
              <option value="date">Sort by Date</option>
              <option value="alphabetical">Sort A-Z</option>
            </select>
          </div>

          <div className="flex items-center border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* NFT Grid/List */}
      {sortedNFTs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Coins className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No NFTs found</h3>
          <p className="text-gray-500 mb-4">
            {filterBy === 'all' 
              ? "You don't have any NFTs in your portfolio yet."
              : `No NFTs match the "${filterBy}" filter.`
            }
          </p>
          <Link
            to="/loans/request"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Request a Loan
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedNFTs.map((nft: NFTLoan) => (
            <div key={nft._id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              {/* NFT Image */}
              <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
                {nft.metadata?.image ? (
                  <img
                    src={nft.metadata.image}
                    alt={nft.metadata.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Coins className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>

              <div className="p-4">
                {/* NFT Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                  {nft.metadata?.name || `NFT #${nft.tokenId}`}
                </h3>

                {/* Contract Info */}
                <p className="text-xs text-gray-500 mb-3 font-mono">
                  {nft.contractAddress?.slice(0, 6)}...{nft.contractAddress?.slice(-4)}
                </p>

                {/* Loan Details */}
                {nft.metadata?.loanDetails && (
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Loan Amount</span>
                      <span className="font-medium">{nft.metadata.loanDetails.amount} ETH</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Interest Rate</span>
                      <span className="font-medium">{nft.metadata.loanDetails.interestRate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Status</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        nft.metadata.loanDetails.status === 'funded' ? 'bg-green-100 text-green-800' :
                        nft.metadata.loanDetails.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                        nft.metadata.loanDetails.status === 'repaid' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {nft.metadata.loanDetails.status}
                      </span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  <button className="flex-1 bg-blue-600 text-white text-center py-2 px-3 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center">
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </button>
                  <button className="p-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition-colors">
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-700">
              <div>NFT</div>
              <div>Contract</div>
              <div>Loan Amount</div>
              <div>Interest Rate</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {sortedNFTs.map((nft: NFTLoan) => (
              <div key={nft._id} className="px-6 py-4 hover:bg-gray-50">
                <div className="grid grid-cols-6 gap-4 items-center">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-gray-100 rounded-lg mr-3 overflow-hidden">
                      {nft.metadata?.image ? (
                        <img
                          src={nft.metadata.image}
                          alt={nft.metadata.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Coins className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{nft.metadata?.name || `NFT #${nft.tokenId}`}</p>
                      <p className="text-xs text-gray-500">Token #{nft.tokenId}</p>
                    </div>
                  </div>
                  <div className="text-sm font-mono text-gray-600">
                    {nft.contractAddress?.slice(0, 6)}...{nft.contractAddress?.slice(-4)}
                  </div>
                  <div className="font-medium">
                    {nft.metadata?.loanDetails?.amount || 'N/A'} ETH
                  </div>
                  <div className="font-medium">
                    {nft.metadata?.loanDetails?.interestRate || 'N/A'}%
                  </div>
                  <div>
                    {nft.metadata?.loanDetails ? (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        nft.metadata.loanDetails.status === 'funded' ? 'bg-green-100 text-green-800' :
                        nft.metadata.loanDetails.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                        nft.metadata.loanDetails.status === 'repaid' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {nft.metadata.loanDetails.status}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">No loan</span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View
                    </button>
                    <button className="text-gray-400 hover:text-gray-600">
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Portfolio
