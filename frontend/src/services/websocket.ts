import { io, Socket } from 'socket.io-client'
import { toast } from 'react-hot-toast'

interface WebSocketEvents {
  // Connection events
  'connection:confirmed': (data: { userId: string; role: string; timestamp: Date }) => void
  'subscribed': (data: { channel: string }) => void

  // Loan events
  'loan:request:submitted': (data: {
    loanId: string
    status: string
    message: string
    timestamp: Date
  }) => void

  'loan:status': (data: {
    loanId: string
    userId: string
    status: 'approved' | 'rejected'
    amount?: number
    rejectionReason?: string
    timestamp: Date
  }) => void

  'loan:funded': (data: {
    loanId: string
    userId: string
    txHash: string
    nftId: string
    amount: number
    timestamp: Date
  }) => void

  'loan:new': (data: {
    loanId: string
    userId: string
    amount: number
    purpose: string
    collateral: any
    timestamp: Date
  }) => void

  'loan:status:updated': (data: {
    loanId: string
    userId: string
    status: 'approved' | 'rejected'
    amount?: number
    rejectionReason?: string
    timestamp: Date
  }) => void

  // KYC events
  'kyc:status': (data: {
    userId: string
    status: 'approved' | 'rejected'
    rejectionReason?: string
    timestamp: Date
  }) => void

  // Admin events
  'admin:notification': (data: {
    type: 'loan_request' | 'kyc_submission' | 'system_alert'
    message: string
    data: any
    timestamp: Date
  }) => void

  // Marketplace events
  'marketplace:update': (data: {
    type: 'new_listing' | 'ownership_transfer' | 'repayment'
    loanId: string
    nftId?: string
    amount?: number
    timestamp: Date
  }) => void
}

export type EventCallback<T = any> = (data: T) => void

class WebSocketService {
  private socket: Socket | null = null
  private isConnected = false
  private listeners: Map<string, Set<EventCallback>> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectTimeout: NodeJS.Timeout | null = null

  constructor() {
    this.initializeEventListeners()
  }

  // Initialize WebSocket connection
  connect(token: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.isConnected && this.socket) {
        resolve(true)
        return
      }

      const serverUrl = process.env.NODE_ENV === 'production' 
        ? 'wss://your-domain.com' 
        : 'http://localhost:5001'

      this.socket = io(serverUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        timeout: 10000
      })

      this.socket.on('connect', () => {
        console.log('🔌 WebSocket connected:', this.socket?.id)
        this.isConnected = true
        this.reconnectAttempts = 0
        this.clearReconnectTimeout()
        resolve(true)
      })

      this.socket.on('connection:confirmed', (data) => {
        console.log('✅ WebSocket connection confirmed:', data)
        toast.success('Real-time updates enabled!', {
          duration: 3000,
          position: 'bottom-right'
        })
      })

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error)
        this.isConnected = false
        reject(error)
      })

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 WebSocket disconnected:', reason)
        this.isConnected = false
        this.handleReconnection()
      })

      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`🔄 WebSocket reconnected after ${attemptNumber} attempts`)
        this.isConnected = true
        this.reconnectAttempts = 0
        toast.success('Connection restored!', {
          duration: 2000,
          position: 'bottom-right'
        })
      })

      this.socket.on('reconnect_error', (error) => {
        console.error('🔄 WebSocket reconnection error:', error)
        this.reconnectAttempts++
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          toast.error('Connection lost. Please refresh the page.', {
            duration: 0, // Don't auto-dismiss
            position: 'top-center'
          })
        }
      })

      // Set up all event listeners
      this.setupEventListeners()
      
      // Connect
      this.socket.connect()

      // Timeout fallback
      setTimeout(() => {
        if (!this.isConnected) {
          reject(new Error('Connection timeout'))
        }
      }, 10000)
    })
  }

  // Disconnect WebSocket
  disconnect(): void {
    this.clearReconnectTimeout()
    
    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket.disconnect()
      this.socket = null
    }
    
    this.isConnected = false
    this.listeners.clear()
    console.log('🔌 WebSocket disconnected manually')
  }

  // Subscribe to specific channels
  subscribe(channel: 'loans' | 'marketplace'): void {
    if (!this.isConnected || !this.socket) {
      console.warn('WebSocket not connected, cannot subscribe')
      return
    }

    this.socket.emit(`subscribe:${channel}`)
  }

  // Event listener management
  on<K extends keyof WebSocketEvents>(
    event: K,
    callback: WebSocketEvents[K]
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback as EventCallback)
  }

  off<K extends keyof WebSocketEvents>(
    event: K,
    callback: WebSocketEvents[K]
  ): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.delete(callback as EventCallback)
    }
  }

  // Send events to server
  emit(event: string, data?: any): void {
    if (this.isConnected && this.socket) {
      this.socket.emit(event, data)
    } else {
      console.warn('WebSocket not connected, cannot emit event:', event)
    }
  }

  // Ping server
  ping(): void {
    this.emit('ping')
  }

  // Connection status
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true
  }

  // Get connection ID
  getSocketId(): string | undefined {
    return this.socket?.id
  }

  // Private methods
  private initializeEventListeners(): void {
    // Set up default notification handlers
    this.on('loan:status', this.handleLoanStatusNotification.bind(this))
    this.on('loan:funded', this.handleLoanFundedNotification.bind(this))
    this.on('kyc:status', this.handleKYCStatusNotification.bind(this))
    this.on('admin:notification', this.handleAdminNotification.bind(this))
    this.on('marketplace:update', this.handleMarketplaceUpdate.bind(this))
  }

  private setupEventListeners(): void {
    if (!this.socket) return

    // Set up all event listeners from the listeners map
    for (const [event, callbacks] of this.listeners.entries()) {
      this.socket.on(event, (data: any) => {
        callbacks.forEach(callback => {
          try {
            callback(data)
          } catch (error) {
            console.error(`Error in WebSocket event handler for ${event}:`, error)
          }
        })
      })
    }

    // Handle pong responses
    this.socket.on('pong', (data) => {
      console.log('🏓 WebSocket pong received:', data)
    })
  }

  private handleReconnection(): void {
    if (this.reconnectTimeout) return

    this.reconnectTimeout = setTimeout(() => {
      if (!this.isConnected && this.reconnectAttempts < this.maxReconnectAttempts) {
        console.log(`🔄 Attempting to reconnect... (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`)
        this.reconnectAttempts++
      }
      this.reconnectTimeout = null
    }, 2000)
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
  }

  // Default notification handlers
  private handleLoanStatusNotification(data: any): void {
    const { status, amount, rejectionReason } = data
    
    if (status === 'approved') {
      toast.success(
        `🎉 Loan Approved! $${amount?.toLocaleString()} has been approved.`,
        { duration: 5000, position: 'top-center' }
      )
    } else if (status === 'rejected') {
      toast.error(
        `❌ Loan Rejected: ${rejectionReason || 'Please contact support for details.'}`,
        { duration: 8000, position: 'top-center' }
      )
    }
  }

  private handleLoanFundedNotification(data: any): void {
    const { amount, nftId } = data
    
    toast.success(
      `💰 Loan Funded! $${amount?.toLocaleString()} transferred. NFT #${nftId} minted.`,
      { duration: 6000, position: 'top-center' }
    )
  }

  private handleKYCStatusNotification(data: any): void {
    const { status, rejectionReason } = data
    
    if (status === 'approved') {
      toast.success(
        '✅ KYC Approved! You can now apply for loans.',
        { duration: 5000, position: 'top-center' }
      )
    } else if (status === 'rejected') {
      toast.error(
        `❌ KYC Rejected: ${rejectionReason || 'Please resubmit your documents.'}`,
        { duration: 8000, position: 'top-center' }
      )
    }
  }

  private handleAdminNotification(data: any): void {
    // Only show to admins - this should be filtered by role on the frontend
    const { type, message } = data
    
    if (type === 'loan_request') {
      toast(`📋 ${message}`, {
        duration: 4000,
        position: 'top-right',
        icon: '🆕'
      })
    } else if (type === 'kyc_submission') {
      toast(`🛡️ ${message}`, {
        duration: 4000,
        position: 'top-right',
        icon: '📄'
      })
    } else if (type === 'system_alert') {
      toast.error(`⚠️ ${message}`, {
        duration: 6000,
        position: 'top-center'
      })
    }
  }

  private handleMarketplaceUpdate(data: any): void {
    const { type, amount, nftId } = data
    
    if (type === 'new_listing') {
      toast(`🏪 New NFT loan available: #${nftId} ($${amount?.toLocaleString()})`, {
        duration: 4000,
        position: 'bottom-right'
      })
    }
  }
}

// Export singleton instance
export const wsService = new WebSocketService()
export default wsService
