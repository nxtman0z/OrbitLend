import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import { toast } from 'react-hot-toast'

// Polyfill for crypto.randomUUID if not available
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

interface WalletState {
  isConnected: boolean
  account: string | null
  provider: ethers.BrowserProvider | null
  signer: ethers.JsonRpcSigner | null
  chainId: number | null
  isMetaMaskInstalled: boolean
}

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    account: null,
    provider: null,
    signer: null,
    chainId: null,
    isMetaMaskInstalled: false
  })

  const [isConnecting, setIsConnecting] = useState(false)

  // Check if MetaMask is installed
  useEffect(() => {
    const checkMetaMask = () => {
      const { ethereum } = window as any
      setWalletState(prev => ({
        ...prev,
        isMetaMaskInstalled: !!ethereum && !!ethereum.isMetaMask
      }))
    }

    checkMetaMask()
  }, [])

  // Check for existing connection
  useEffect(() => {
    const checkConnection = async () => {
      const { ethereum } = window as any
      if (!ethereum) return

      try {
        const provider = new ethers.BrowserProvider(ethereum)
        const accounts = await provider.listAccounts()
        
        if (accounts.length > 0) {
          const signer = await provider.getSigner()
          const network = await provider.getNetwork()
          const accountAddress = accounts[0].address
          
          console.log('Existing connection found:', accountAddress)
          
          setWalletState(prev => ({
            ...prev,
            isConnected: true,
            account: accountAddress,
            provider,
            signer,
            chainId: Number(network.chainId)
          }))
        }
      } catch (error) {
        console.log('No existing connection found:', error)
      }
    }

    if (walletState.isMetaMaskInstalled) {
      checkConnection()
    }
  }, [walletState.isMetaMaskInstalled])

  // Listen for account changes
  useEffect(() => {
    const { ethereum } = window as any
    if (!ethereum) return

    const handleAccountsChanged = (accounts: string[]) => {
      console.log('Account changed:', accounts)
      if (accounts.length === 0) {
        // User disconnected
        setWalletState(prev => ({
          ...prev,
          isConnected: false,
          account: null,
          provider: null,
          signer: null
        }))
        toast.error('Wallet disconnected')
      } else {
        // Account changed
        setWalletState(prev => ({
          ...prev,
          account: accounts[0]
        }))
        toast.success(`Account changed to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`)
      }
    }

    const handleChainChanged = (chainId: string) => {
      setWalletState(prev => ({
        ...prev,
        chainId: parseInt(chainId, 16)
      }))
      toast.success(`Network changed to chain ID: ${parseInt(chainId, 16)}`)
    }

    ethereum.on('accountsChanged', handleAccountsChanged)
    ethereum.on('chainChanged', handleChainChanged)

    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged)
      ethereum.removeListener('chainChanged', handleChainChanged)
    }
  }, [])

  const connectWallet = useCallback(async () => {
    const { ethereum } = window as any
    
    if (!ethereum) {
      toast.error('MetaMask is not installed. Please install MetaMask to continue.')
      window.open('https://metamask.io/download/', '_blank')
      return false
    }

    setIsConnecting(true)

    try {
      // Request account access
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts'
      })

      console.log('MetaMask accounts:', accounts)

      if (accounts.length === 0) {
        toast.error('No accounts found. Please check your MetaMask.')
        return false
      }

      const provider = new ethers.BrowserProvider(ethereum)
      const signer = await provider.getSigner()
      const network = await provider.getNetwork()
      const accountAddress = accounts[0]

      console.log('Connected account:', accountAddress)

      setWalletState(prev => ({
        ...prev,
        isConnected: true,
        account: accountAddress,
        provider,
        signer,
        chainId: Number(network.chainId)
      }))

      toast.success('Wallet connected successfully!')
      return true

    } catch (error: any) {
      console.error('Wallet connection failed:', error)
      
      if (error.code === 4001) {
        toast.error('Connection rejected by user')
      } else if (error.code === -32002) {
        toast.error('Connection request already pending')
      } else {
        toast.error('Failed to connect wallet')
      }
      return false
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnectWallet = useCallback(() => {
    setWalletState(prev => ({
      ...prev,
      isConnected: false,
      account: null,
      provider: null,
      signer: null
    }))
    toast.success('Wallet disconnected')
  }, [])

  const switchNetwork = useCallback(async (chainId: number) => {
    const { ethereum } = window as any
    if (!ethereum) return false

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      })
      return true
    } catch (error: any) {
      console.error('Network switch failed:', error)
      toast.error(`Failed to switch to network ${chainId}`)
      return false
    }
  }, [])

  // Sign a message for authentication
  const signMessage = useCallback(async (message: string): Promise<string | null> => {
    if (!walletState.signer) {
      toast.error('Wallet not connected')
      return null
    }

    try {
      const signature = await walletState.signer.signMessage(message)
      return signature
    } catch (error: any) {
      console.error('Message signing failed:', error)
      
      if (error.code === 4001) {
        toast.error('Signing rejected by user')
      } else {
        toast.error('Failed to sign message')
      }
      return null
    }
  }, [walletState.signer])

  // Get balance
  const getBalance = useCallback(async (): Promise<string | null> => {
    if (!walletState.provider || !walletState.account) return null

    try {
      const balance = await walletState.provider.getBalance(walletState.account)
      return ethers.formatEther(balance)
    } catch (error) {
      console.error('Failed to get balance:', error)
      return null
    }
  }, [walletState.provider, walletState.account])

  return {
    ...walletState,
    isConnecting,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    signMessage,
    getBalance
  }
}
