import { useState, useMemo, useEffect } from 'react'
import { useQuery } from 'react-query'
import { apiService } from '../../services/api'
import { NFTLoan } from '../../types'
import { Search, Clock, DollarSign, TrendingUp, Users, Star, ExternalLink, RefreshCw, Grid, List, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'

const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'amount' | 'interestRate' | 'termMonths' | 'newest'>('newest')
  const [filterByAmount, setFilterByAmount] = useState<'all' | 'small' | 'medium' | 'large'>('all')
  const [filterByRate, setFilterByRate] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Debounce search term to improve performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch marketplace data using NFTLoan endpoint with optimization
  const { data: loansResponse, isLoading, error, refetch } = useQuery(
    ['marketplace-loans'],
    async () => {
      try {
        return await apiService.browseMarketplace({
          page: 1,
          limit: 20 // Reduce initial load
        })
      } catch (err) {
        console.error('Failed to fetch marketplace data:', err)
        throw err
      }
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
      onError: (error: Error) => {
        console.error('Marketplace error:', error)
        toast.error('Failed to load marketplace data. Using demo data.')
      }
    }
  )

  // Optimized demo data - smaller dataset
  const demoData: NFTLoan[] = [
    {
      _id: 'demo-1',
      loanId: 'loan-1',
      tokenId: '4521',
      contractAddress: '0x123...abc',
      transactionHash: '0x456...def',
      ownerAddress: '0x789...ghi',
      previousOwners: [],
      metadata: {
        name: 'Premium Art Loan NFT',
        description: 'High-value digital art collection',
        image: 'https://via.placeholder.com/300x300/8b5cf6/ffffff?text=Art+NFT',
        attributes: [],
        loanDetails: {
          amount: 15000,
          interestRate: 8.5,
          termMonths: 18,
          purpose: 'Premium Art NFT Collection',
          status: 'active',
          approvalDate: new Date('2024-01-16').toISOString()
        }
      },
      verbwireData: {
        mintedAt: new Date('2024-01-15').toISOString(),
        network: 'ethereum'
      },
      marketplaceStatus: 'listed',
      listingPrice: 16500,
      listingDate: new Date('2024-01-20').toISOString(),
      isActive: true,
      createdAt: new Date('2024-01-15').toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'demo-2',
      loanId: 'loan-2',
      tokenId: '7892',
      contractAddress: '0x234...bcd',
      transactionHash: '0x567...efg',
      ownerAddress: '0x890...hij',
      previousOwners: [],
      metadata: {
        name: 'Gaming NFT Investment',
        description: 'Rare gaming assets with high liquidity',
        image: 'https://via.placeholder.com/300x300/3b82f6/ffffff?text=Game+NFT',
        attributes: [],
        loanDetails: {
          amount: 8000,
          interestRate: 10.2,
          termMonths: 6,
          purpose: 'Gaming NFT Investment',
          status: 'active',
          approvalDate: new Date('2024-01-12').toISOString()
        }
      },
      verbwireData: {
        mintedAt: new Date('2024-01-10').toISOString(),
        network: 'ethereum'
      },
      marketplaceStatus: 'listed',
      listingPrice: 8500,
      listingDate: new Date('2024-01-18').toISOString(),
      isActive: true,
      createdAt: new Date('2024-01-10').toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]

  // Get loans from API or use demo data - check for loans key in response
  const nftLoans = error ? demoData : (loansResponse?.data?.loans || loansResponse?.data?.nfts || demoData)
  
  // Filter to only show listed/active NFT loans
  const marketplaceLoans = nftLoans.filter((nft: NFTLoan) => 
    nft.marketplaceStatus === 'listed' && nft.isActive && nft.metadata?.loanDetails
  )

  // Helper functions for categorization
  const getAmountCategory = (amount: number) => {
    if (amount < 5000) return 'small'
    if (amount < 15000) return 'medium'
    return 'large'
  }

  const getRateCategory = (rate: number) => {
    if (rate < 8) return 'low'
    if (rate < 12) return 'medium'
    return 'high'
  }

  // Optimized filtering and sorting with useMemo
  const sortedLoans = useMemo(() => {
    const filtered = marketplaceLoans.filter((nft: NFTLoan) => {
      const loanDetails = nft.metadata?.loanDetails
      if (!loanDetails) return false

      const matchesSearch = debouncedSearchTerm === '' || 
        nft.metadata.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        nft.metadata.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        loanDetails.purpose.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        nft.tokenId.includes(debouncedSearchTerm)
      
      const matchesAmount = filterByAmount === 'all' || getAmountCategory(loanDetails.amount) === filterByAmount
      const matchesRate = filterByRate === 'all' || getRateCategory(loanDetails.interestRate) === filterByRate

      return matchesSearch && matchesAmount && matchesRate
    })

    const sorted = [...filtered].sort((a, b) => {
      const aLoan = a.metadata?.loanDetails
      const bLoan = b.metadata?.loanDetails
      if (!aLoan || !bLoan) return 0

      switch (sortBy) {
        case 'amount':
          return bLoan.amount - aLoan.amount
        case 'interestRate':
          return aLoan.interestRate - bLoan.interestRate
        case 'termMonths':
          return aLoan.termMonths - bLoan.termMonths
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })

    return sorted
  }, [marketplaceLoans, debouncedSearchTerm, sortBy, filterByAmount, filterByRate])

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

  const getUserName = (ownerAddress: string) => {
    return `${ownerAddress.slice(0, 6)}...${ownerAddress.slice(-4)}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">NFT Loan Marketplace</h1>
              <p className="text-gray-600">Discover and invest in NFT-backed loans</p>
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              {error && (
                <button
                  onClick={() => refetch()}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry</span>
                </button>
              )}
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

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Listed</p>
                  <p className="text-xl font-bold text-gray-900">{sortedLoans.length}</p>
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
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(sortedLoans.reduce((sum, nft) => sum + (nft.metadata?.loanDetails?.amount || 0), 0))}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Lenders</p>
                  <p className="text-xl font-bold text-gray-900">
                    {new Set(sortedLoans.map(nft => getUserName(nft.ownerAddress))).size}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Star className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg. Rate</p>
                  <p className="text-xl font-bold text-gray-900">
                    {sortedLoans.length > 0 ? 
                      (sortedLoans.reduce((sum, nft) => sum + (nft.metadata?.loanDetails?.interestRate || 0), 0) / sortedLoans.length).toFixed(1) + '%'
                      : '0%'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <p className="text-yellow-800">
                  Unable to load live data. Showing demo marketplace loans.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search loans, users, or descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="amount">Highest Amount</option>
                <option value="interestRate">Lowest Rate</option>
                <option value="termMonths">Shortest Term</option>
              </select>
            </div>

            {/* Filter by Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount Range</label>
              <select
                value={filterByAmount}
                onChange={(e) => setFilterByAmount(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Amounts</option>
                <option value="small">Under $5K</option>
                <option value="medium">$5K - $15K</option>
                <option value="large">Over $15K</option>
              </select>
            </div>

            {/* Filter by Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Interest Rate</label>
              <select
                value={filterByRate}
                onChange={(e) => setFilterByRate(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Rates</option>
                <option value="low">Under 8%</option>
                <option value="medium">8% - 12%</option>
                <option value="high">Over 12%</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loans Grid/List */}
        {sortedLoans.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No loans found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters</p>
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
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{loan.metadata?.name || 'NFT Loan'}</h3>
                        <p className="text-sm text-gray-600 mb-2">by {getUserName(loan.ownerAddress)}</p>
                        <p className="text-sm text-gray-500 line-clamp-2">{loan.metadata?.description || 'NFT-backed loan on the marketplace'}</p>
                      </div>
                      <div className="ml-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Listed
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Loan Amount</span>
                        <span className="text-lg font-bold text-gray-900">{formatCurrency(loan.metadata?.loanDetails?.amount || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Interest Rate</span>
                        <span className="text-sm font-medium text-blue-600">{loan.metadata?.loanDetails?.interestRate || 0}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Duration</span>
                        <span className="text-sm text-gray-900">{loan.metadata?.loanDetails?.termMonths || 0} months</span>
                      </div>
                      {loan.listingPrice && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Market Price</span>
                          <span className="text-lg font-bold text-green-600">{formatCurrency(loan.listingPrice)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatDate(loan.createdAt)}
                      </div>
                      <Link
                        to={`/nft/${loan._id}`}
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
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{loan.metadata?.name || 'NFT Loan'}</h3>
                          <p className="text-sm text-gray-600">by {getUserName(loan.ownerAddress)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">{formatCurrency(loan.metadata?.loanDetails?.amount || 0)}</p>
                          <p className="text-sm text-blue-600">{loan.metadata?.loanDetails?.interestRate || 0}% APR</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{loan.metadata?.loanDetails?.termMonths || 0} months</p>
                          <p className="text-sm text-gray-500">{formatDate(loan.createdAt)}</p>
                        </div>
                        <div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Listed
                          </span>
                        </div>
                        <Link
                          to={`/nft/${loan._id}`}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View Details
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

export default Marketplace
