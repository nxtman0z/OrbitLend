import { Server as SocketServer, Socket } from 'socket.io'
import { Server as HttpServer } from 'http'
import jwt from 'jsonwebtoken'

interface AuthenticatedSocket extends Socket {
  userId?: string
  userRole?: string
}

export interface WebSocketEvents {
  // Loan Events
  'loan:new': (data: {
    loanId: string
    userId: string
    amount: number
    purpose: string
    collateral: any
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

  // KYC Events
  'kyc:status': (data: {
    userId: string
    status: 'approved' | 'rejected'
    rejectionReason?: string
    timestamp: Date
  }) => void

  // Marketplace Events
  'marketplace:update': (data: {
    type: 'new_listing' | 'ownership_transfer' | 'repayment'
    loanId: string
    nftId?: string
    amount?: number
    timestamp: Date
  }) => void

  // Admin Events
  'admin:notification': (data: {
    type: 'loan_request' | 'kyc_submission' | 'system_alert'
    message: string
    data: any
    timestamp: Date
  }) => void
}

class WebSocketService {
  private io: SocketServer
  private userSockets: Map<string, Set<string>> = new Map() // userId -> Set of socketIds
  private adminSockets: Set<string> = new Set() // Set of admin socketIds

  constructor(server: HttpServer) {
    this.io = new SocketServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://yourdomain.com'] 
          : [
              'http://localhost:3000', 
              'http://localhost:5173',
              'http://127.0.0.1:3000',
              'http://10.4.6.151:3000'
            ],
        credentials: true
      },
      transports: ['websocket', 'polling']
    })

    this.setupSocketHandlers()
  }

  private setupSocketHandlers() {
    this.io.use(this.authenticateSocket.bind(this))

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`🔌 Client connected: ${socket.id} (User: ${socket.userId}, Role: ${socket.userRole})`)

      // Store socket connection based on user role
      if (socket.userId) {
        // User socket management
        if (!this.userSockets.has(socket.userId)) {
          this.userSockets.set(socket.userId, new Set())
        }
        this.userSockets.get(socket.userId)!.add(socket.id)

        // Admin socket management
        if (socket.userRole === 'admin') {
          this.adminSockets.add(socket.id)
          socket.join('admin-channel')
        }

        // User-specific room
        socket.join(`user-${socket.userId}`)

        // Send connection confirmation
        socket.emit('connection:confirmed', {
          userId: socket.userId,
          role: socket.userRole,
          timestamp: new Date()
        })
      }

      // Handle socket events
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date() })
      })

      socket.on('subscribe:loans', () => {
        if (socket.userRole === 'admin') {
          socket.join('loan-updates')
          socket.emit('subscribed', { channel: 'loan-updates' })
        }
      })

      socket.on('subscribe:marketplace', () => {
        socket.join('marketplace-updates')
        socket.emit('subscribed', { channel: 'marketplace-updates' })
      })

      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`)
        
        if (socket.userId) {
          // Remove from user sockets
          const userSocketSet = this.userSockets.get(socket.userId)
          if (userSocketSet) {
            userSocketSet.delete(socket.id)
            if (userSocketSet.size === 0) {
              this.userSockets.delete(socket.userId)
            }
          }

          // Remove from admin sockets
          if (socket.userRole === 'admin') {
            this.adminSockets.delete(socket.id)
          }
        }
      })
    })
  }

  private async authenticateSocket(socket: any, next: any) {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '')
      
      if (!token) {
        return next(new Error('Authentication token required'))
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
      socket.userId = decoded.userId
      socket.userRole = decoded.role || 'user'
      
      next()
    } catch (error) {
      next(new Error('Invalid authentication token'))
    }
  }

  // Loan Events
  public emitLoanRequest(data: {
    loanId: string
    userId: string
    amount: number
    purpose: string
    collateral: any
  }) {
    const eventData = {
      ...data,
      timestamp: new Date()
    }

    // Notify all admins about new loan request
    this.io.to('admin-channel').emit('loan:new', eventData)
    
    // Send notification to requesting user
    this.io.to(`user-${data.userId}`).emit('loan:request:submitted', {
      loanId: data.loanId,
      status: 'pending',
      message: 'Your loan request has been submitted and is under review',
      timestamp: new Date()
    })

    console.log(`📝 Loan request emitted: ${data.loanId} for user ${data.userId}`)
  }

  public emitLoanStatusUpdate(data: {
    loanId: string
    userId: string
    status: 'approved' | 'rejected'
    amount?: number
    rejectionReason?: string
  }) {
    const eventData = {
      ...data,
      timestamp: new Date()
    }

    // Notify the specific user about status change
    this.io.to(`user-${data.userId}`).emit('loan:status', eventData)
    
    // Notify admins about the status update
    this.io.to('admin-channel').emit('loan:status:updated', eventData)

    console.log(`✅ Loan status update emitted: ${data.loanId} - ${data.status}`)
  }

  public emitLoanFunded(data: {
    loanId: string
    userId: string
    txHash: string
    nftId: string
    amount: number
  }) {
    const eventData = {
      ...data,
      timestamp: new Date()
    }

    // Notify the user about successful funding
    this.io.to(`user-${data.userId}`).emit('loan:funded', eventData)
    
    // Notify admins
    this.io.to('admin-channel').emit('loan:funded', eventData)
    
    // Update marketplace
    this.io.to('marketplace-updates').emit('marketplace:update', {
      type: 'new_listing',
      loanId: data.loanId,
      nftId: data.nftId,
      amount: data.amount,
      timestamp: new Date()
    })

    console.log(`💰 Loan funded notification emitted: ${data.loanId}`)
  }

  // KYC Events
  public emitKYCStatusUpdate(data: {
    userId: string
    status: 'approved' | 'rejected'
    rejectionReason?: string
  }) {
    const eventData = {
      ...data,
      timestamp: new Date()
    }

    // Notify the specific user
    this.io.to(`user-${data.userId}`).emit('kyc:status', eventData)

    console.log(`🛡️ KYC status update emitted: ${data.userId} - ${data.status}`)
  }

  // Admin Notifications
  public emitAdminNotification(data: {
    type: 'loan_request' | 'kyc_submission' | 'system_alert'
    message: string
    data: any
  }) {
    const eventData = {
      ...data,
      timestamp: new Date()
    }

    // Notify all admins
    this.io.to('admin-channel').emit('admin:notification', eventData)

    console.log(`🔔 Admin notification emitted: ${data.type}`)
  }

  // Marketplace Events
  public emitMarketplaceUpdate(data: {
    type: 'new_listing' | 'ownership_transfer' | 'repayment'
    loanId: string
    nftId?: string
    amount?: number
  }) {
    const eventData = {
      ...data,
      timestamp: new Date()
    }

    // Notify all marketplace subscribers
    this.io.to('marketplace-updates').emit('marketplace:update', eventData)

    console.log(`🏪 Marketplace update emitted: ${data.type}`)
  }

  // Utility Methods
  public sendToUser(userId: string, event: string, data: any) {
    this.io.to(`user-${userId}`).emit(event, data)
  }

  public sendToAdmins(event: string, data: any) {
    this.io.to('admin-channel').emit(event, data)
  }

  public broadcastToAll(event: string, data: any) {
    this.io.emit(event, data)
  }

  // Connection Status
  public getConnectedUsers(): string[] {
    return Array.from(this.userSockets.keys())
  }

  public getConnectedAdmins(): number {
    return this.adminSockets.size
  }

  public isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0
  }

  // Get IO instance for direct use if needed
  public getIO(): SocketServer {
    return this.io
  }
}

export default WebSocketService
