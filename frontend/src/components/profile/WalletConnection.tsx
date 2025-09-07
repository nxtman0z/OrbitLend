import React, { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { Wallet, ExternalLink, Copy, Unlink, Shield, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '../../stores/authStore'
import { apiService } from '../../services/api'

interface WalletConnectionProps {
  className?: string
}

declare global {
  interface Window {
    ethereum?: any
  }
}

export const WalletConnection: React.FC<WalletConnectionProps> = ({ className = '' }) => {
  const { user, updateUser } = useAuthStore()
  const queryClient = useQueryClient()
  const [isConnecting, setIsConnecting] = useState(false)
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)

  // Connect wallet mutation
  const connectWalletMutation = useMutation(
    (walletAddress: string) => 
      apiService.updateProfile({ walletAddress }),
    {
      onSuccess: (response) => {
        updateUser(response.data)
        queryClient.invalidateQueries('profile')
        toast.success('Wallet connected successfully!')
        setIsConnecting(false)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to connect wallet')
        setIsConnecting(false)
      }
    }
  )

  // Disconnect wallet mutation
  const disconnectWalletMutation = useMutation(
    () => apiService.updateProfile({ walletAddress: '' }),
    {
      onSuccess: (response) => {
        updateUser(response.data)
        queryClient.invalidateQueries('profile')
        toast.success('Wallet disconnected successfully!')
        setShowDisconnectConfirm(false)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to disconnect wallet')
      }
    }
  )

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('MetaMask is not installed. Please install MetaMask to connect your wallet.')
      return
    }

    setIsConnecting(true)

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (accounts.length > 0) {
        const walletAddress = accounts[0]
        connectWalletMutation.mutate(walletAddress)
      } else {
        toast.error('No wallet accounts found')
        setIsConnecting(false)
      }
    } catch (error: any) {
      console.error('Error connecting wallet:', error)
      if (error.code === 4001) {
        toast.error('Wallet connection was rejected')
      } else {
        toast.error('Failed to connect wallet')
      }
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    disconnectWalletMutation.mutate()
  }

  const copyAddress = () => {
    if (user?.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress)
      toast.success('Wallet address copied to clipboard!')
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const openInExplorer = () => {
    if (user?.walletAddress) {
      window.open(`https://etherscan.io/address/${user.walletAddress}`, '_blank')
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Wallet Connection</h3>
      </div>

      {user?.walletAddress ? (
        <div className="space-y-4">
          {/* Connected Wallet Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Wallet Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <code className="text-sm bg-green-100 px-2 py-1 rounded font-mono">
                  {formatAddress(user.walletAddress)}
                </code>
                <button
                  onClick={copyAddress}
                  className="p-1 hover:bg-green-200 rounded"
                  title="Copy address"
                >
                  <Copy className="h-4 w-4 text-green-600" />
                </button>
                <button
                  onClick={openInExplorer}
                  className="p-1 hover:bg-green-200 rounded"
                  title="View on Etherscan"
                >
                  <ExternalLink className="h-4 w-4 text-green-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Wallet Benefits */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Benefits of connecting your wallet:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                Receive NFT collateral certificates
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                Access to DeFi lending features
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                Enhanced security and transparency
              </li>
            </ul>
          </div>

          {/* Disconnect Button */}
          {!showDisconnectConfirm ? (
            <button
              onClick={() => setShowDisconnectConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Unlink className="h-4 w-4" />
              Disconnect Wallet
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Confirm Disconnection</span>
              </div>
              <p className="text-sm text-red-700 mb-3">
                Are you sure you want to disconnect your wallet? You'll lose access to NFT features and DeFi functionality.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={disconnectWallet}
                  disabled={disconnectWalletMutation.isLoading}
                  className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {disconnectWalletMutation.isLoading ? 'Disconnecting...' : 'Yes, Disconnect'}
                </button>
                <button
                  onClick={() => setShowDisconnectConfirm(false)}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Not Connected State */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">No Wallet Connected</span>
            </div>
            <p className="text-sm text-gray-600">
              Connect your wallet to access advanced features and receive NFT collateral certificates.
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Connect your wallet to:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                Receive NFT collateral certificates
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                Access DeFi lending features
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                Enhanced transaction security
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                Blockchain-verified loan records
              </li>
            </ul>
          </div>

          {/* Connect Button */}
          <button
            onClick={connectWallet}
            disabled={isConnecting || connectWalletMutation.isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Wallet className="h-4 w-4" />
            {isConnecting || connectWalletMutation.isLoading ? 'Connecting...' : 'Connect Wallet'}
          </button>

          {/* MetaMask Note */}
          <p className="text-xs text-gray-500 text-center">
            Make sure you have MetaMask installed in your browser
          </p>
        </div>
      )}
    </div>
  )
}
