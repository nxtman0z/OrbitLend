import { useEffect, useCallback, useRef, useState } from 'react'
import { wsService } from '../services/websocket'
import { useAuthStore } from '../stores/authStore'

export interface UseWebSocketOptions {
  autoConnect?: boolean
  subscribeToLoans?: boolean
  subscribeToMarketplace?: boolean
}

export interface WebSocketState {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  connectionId?: string
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const { 
    autoConnect = true, 
    subscribeToLoans = false,
    subscribeToMarketplace = false 
  } = options

  const { user, token } = useAuthStore()
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null
  })

  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isConnectionAttemptedRef = useRef(false)

  // Connect to WebSocket
  const connect = useCallback(async () => {
    if (!token || state.isConnecting || state.isConnected) {
      return
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }))

    try {
      await wsService.connect(token)
      
      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        connectionId: wsService.getSocketId()
      }))

      // Subscribe to channels if requested
      if (subscribeToLoans) {
        wsService.subscribe('loans')
      }
      if (subscribeToMarketplace) {
        wsService.subscribe('marketplace')
      }

    } catch (error) {
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect'
      }))
      console.error('WebSocket connection failed:', error)
    }
  }, [token, subscribeToLoans, subscribeToMarketplace, state.isConnecting, state.isConnected])

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    wsService.disconnect()
    setState({
      isConnected: false,
      isConnecting: false,
      error: null
    })
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }, [])

  // Ping the server
  const ping = useCallback(() => {
    if (state.isConnected) {
      wsService.ping()
    }
  }, [state.isConnected])

  // Subscribe to specific events
  const on = useCallback((event: string, callback: (data: any) => void) => {
    wsService.on(event as any, callback)
    
    // Return cleanup function
    return () => {
      wsService.off(event as any, callback)
    }
  }, [])

  // Emit events
  const emit = useCallback((event: string, data?: any) => {
    if (state.isConnected) {
      wsService.emit(event, data)
    } else {
      console.warn('Cannot emit event - WebSocket not connected')
    }
  }, [state.isConnected])

  // Auto-connect when user and token are available
  useEffect(() => {
    if (autoConnect && user && token && !isConnectionAttemptedRef.current) {
      isConnectionAttemptedRef.current = true
      connect()
    }
  }, [autoConnect, user, token, connect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  // Periodic connection check
  useEffect(() => {
    if (!state.isConnected) return

    const interval = setInterval(() => {
      const isActuallyConnected = wsService.isSocketConnected()
      if (!isActuallyConnected && state.isConnected) {
        setState(prev => ({ ...prev, isConnected: false }))
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [state.isConnected])

  return {
    ...state,
    connect,
    disconnect,
    ping,
    on,
    emit
  }
}

// Hook specifically for loan-related WebSocket events
export const useLoanWebSocket = () => {
  const ws = useWebSocket({ 
    autoConnect: true, 
    subscribeToLoans: true 
  })

  // Loan-specific event handlers
  const onLoanRequest = useCallback((callback: (data: any) => void) => {
    return ws.on('loan:request:submitted', callback)
  }, [ws])

  const onLoanStatus = useCallback((callback: (data: any) => void) => {
    return ws.on('loan:status', callback)
  }, [ws])

  const onLoanFunded = useCallback((callback: (data: any) => void) => {
    return ws.on('loan:funded', callback)
  }, [ws])

  const onKYCStatus = useCallback((callback: (data: any) => void) => {
    return ws.on('kyc:status', callback)
  }, [ws])

  return {
    ...ws,
    onLoanRequest,
    onLoanStatus,
    onLoanFunded,
    onKYCStatus
  }
}

// Hook specifically for admin WebSocket events
export const useAdminWebSocket = () => {
  const ws = useWebSocket({ 
    autoConnect: true, 
    subscribeToLoans: true 
  })

  // Admin-specific event handlers
  const onNewLoan = useCallback((callback: (data: any) => void) => {
    return ws.on('loan:new', callback)
  }, [ws])

  const onAdminNotification = useCallback((callback: (data: any) => void) => {
    return ws.on('admin:notification', callback)
  }, [ws])

  return {
    ...ws,
    onNewLoan,
    onAdminNotification
  }
}

// Hook for marketplace WebSocket events
export const useMarketplaceWebSocket = () => {
  const ws = useWebSocket({ 
    autoConnect: true, 
    subscribeToMarketplace: true 
  })

  const onMarketplaceUpdate = useCallback((callback: (data: any) => void) => {
    return ws.on('marketplace:update', callback)
  }, [ws])

  return {
    ...ws,
    onMarketplaceUpdate
  }
}
