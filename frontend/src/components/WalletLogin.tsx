import React, { useState } from 'react'
import { Wallet, Loader2, ExternalLink } from 'lucide-react'
import { useWallet } from '../hooks/useWallet'
import { useAuthStore } from '../stores/authStore'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'

interface WalletLoginProps {
  onSuccess?: () => void
}

const WalletLogin: React.FC<WalletLoginProps> = ({ onSuccess }) => {
  const { 
    isConnected, 
    account, 
    isConnecting, 
    isMetaMaskInstalled, 
    connectWallet, 
    signMessage 
  } = useWallet()
  
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleWalletAuth = async () => {
    try {
      // Step 1: Connect wallet if not connected
      if (!isConnected) {
        const connected = await connectWallet()
        if (!connected) return
      }

      if (!account) {
        toast.error('No wallet account found')
        return
      }

      setIsAuthenticating(true)

      console.log('Authenticating with wallet address:', account)
      console.log('Wallet address length:', account?.length)
      console.log('Wallet address format check:', /^0x[a-fA-F0-9]{40}$/.test(account || ''))

      // Step 2: Get nonce from backend
      const nonceResponse = await fetch('http://localhost:5001/api/auth/wallet/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: account
        })
      })

      const nonceResult = await nonceResponse.json()
      console.log('Nonce response:', nonceResult)

      if (!nonceResponse.ok || !nonceResult.success) {
        throw new Error(nonceResult.message || 'Failed to get authentication nonce')
      }

      // Step 3: Sign the message
      const signature = await signMessage(nonceResult.data.message)
      if (!signature) {
        throw new Error('Message signing was cancelled')
      }

      // Step 4: Verify signature with backend
      const verifyResponse = await fetch('http://localhost:5001/api/auth/wallet/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: account,
          signature,
          message: nonceResult.data.message,
          nonce: nonceResult.data.nonce
        })
      })

      const verifyResult = await verifyResponse.json()

      if (!verifyResponse.ok || !verifyResult.success) {
        throw new Error(verifyResult.message || 'Wallet authentication failed')
      }

      // Step 5: Update auth store and redirect
      setAuth(verifyResult.data.user, verifyResult.data.token)
      
      toast.success(`Welcome back! Wallet connected: ${account?.slice(0, 6)}...${account?.slice(-4)}`)
      
      // Redirect based on user role
      if (verifyResult.data.user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }

      onSuccess?.()

    } catch (error: any) {
      console.error('Wallet authentication error:', error)
      toast.error(error.message || 'Wallet authentication failed')
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleInstallMetaMask = () => {
    window.open('https://metamask.io/download/', '_blank')
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (!isMetaMaskInstalled) {
    return (
      <div className="space-y-4">
        <div className="text-center p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
          <Wallet className="w-12 h-12 text-orange-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            MetaMask Required
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            You need MetaMask installed to use wallet login
          </p>
          <button
            onClick={handleInstallMetaMask}
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Install MetaMask
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Wallet Status */}
      {isConnected && account && (
        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-800">
              Connected: {formatAddress(account)}
            </span>
          </div>
        </div>
      )}

      {/* Wallet Login Button */}
      <button
        onClick={handleWalletAuth}
        disabled={isConnecting || isAuthenticating}
        className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
      >
        {isConnecting || isAuthenticating ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            {isConnecting ? 'Connecting Wallet...' : 'Authenticating...'}
          </>
        ) : (
          <>
            <Wallet className="w-5 h-5 mr-2" />
            {isConnected ? 'Sign In with Wallet' : 'Connect Wallet'}
          </>
        )}
      </button>

      {/* Info */}
      <p className="text-xs text-center text-gray-400">
        Connect your Ethereum wallet to sign in securely without a password
      </p>

      {/* Steps */}
      {!isConnected && (
        <div className="text-xs text-gray-500 space-y-1">
          <p className="font-medium">How it works:</p>
          <div className="space-y-1 pl-2">
            <p>1. Connect your MetaMask wallet</p>
            <p>2. Sign a message to verify ownership</p>
            <p>3. Access your OrbitLend account</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default WalletLogin
