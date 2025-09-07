# WebSocket Real-Time Implementation for OrbitLend

## Overview
This implementation provides comprehensive real-time communication between users and admins throughout the loan lifecycle using Socket.IO WebSockets.

## Features

### 🔄 Real-Time Events
- **Loan Requests**: Instant notifications to admins when users submit loan applications
- **Loan Approvals/Rejections**: Real-time status updates to users
- **Loan Funding**: Live updates when crypto is transferred and NFTs are minted
- **KYC Status**: Immediate notifications for KYC approval/rejection
- **Marketplace Updates**: Real-time marketplace activity

### 🔐 Authentication & Security
- JWT-based WebSocket authentication
- Role-based channel subscriptions (users vs admins)
- Secure connection validation

### 📡 Connection Management
- Automatic reconnection with exponential backoff
- Connection status indicators
- Heartbeat ping/pong for connection health
- Error handling and graceful degradation

## Architecture

### Backend (`/backend/src/services/websocket.ts`)
- **WebSocketService Class**: Core service managing all WebSocket functionality
- **Authentication Middleware**: JWT validation for WebSocket connections
- **Event Handlers**: Comprehensive event system for loan workflow
- **Channel Management**: Role-based subscription system

### Frontend (`/frontend/src/services/websocket.ts`)
- **WebSocket Client Service**: Singleton service for client-side WebSocket management
- **Auto-reconnection**: Handles connection drops and recovery
- **Event Listeners**: Type-safe event handling
- **Notification Integration**: Built-in toast notifications

### React Hooks (`/frontend/src/hooks/useWebSocket.ts`)
- **useWebSocket**: Base hook for WebSocket functionality
- **useLoanWebSocket**: Specialized hook for loan-related events
- **useAdminWebSocket**: Admin-specific WebSocket events
- **useMarketplaceWebSocket**: Marketplace event handling

## Event Types

### 🏦 Loan Events
```typescript
// New loan request (to admins)
'loan:new': {
  loanId: string
  userId: string
  amount: number
  purpose: string
  collateral: any
  timestamp: Date
}

// Loan status update (to users)
'loan:status': {
  loanId: string
  userId: string
  status: 'approved' | 'rejected'
  amount?: number
  rejectionReason?: string
  timestamp: Date
}

// Loan funded (to users)
'loan:funded': {
  loanId: string
  userId: string
  txHash: string
  nftId: string
  amount: number
  timestamp: Date
}
```

### 🛡️ KYC Events
```typescript
'kyc:status': {
  userId: string
  status: 'approved' | 'rejected'
  rejectionReason?: string
  timestamp: Date
}
```

### 👑 Admin Events
```typescript
'admin:notification': {
  type: 'loan_request' | 'kyc_submission' | 'system_alert'
  message: string
  data: any
  timestamp: Date
}
```

### 🏪 Marketplace Events
```typescript
'marketplace:update': {
  type: 'new_listing' | 'ownership_transfer' | 'repayment'
  loanId: string
  nftId?: string
  amount?: number
  timestamp: Date
}
```

## Usage Examples

### Frontend - Basic Connection
```typescript
import { useLoanWebSocket } from '../hooks/useWebSocket'

const MyComponent = () => {
  const { isConnected, onLoanStatus, onLoanFunded } = useLoanWebSocket()

  useEffect(() => {
    // Listen for loan status updates
    const cleanup = onLoanStatus((data) => {
      console.log('Loan status updated:', data)
      // Update UI accordingly
    })

    return cleanup // Cleanup on unmount
  }, [onLoanStatus])

  return (
    <div>
      Status: {isConnected ? 'Connected' : 'Disconnected'}
    </div>
  )
}
```

### Backend - Emit Events
```typescript
// In loan routes
import { wsService } from '../services/websocket'

// When a new loan is requested
wsService.emitLoanRequest(loanData)
wsService.emitAdminNotification('loan_request', `New loan request for $${amount}`, loanData)

// When loan is approved
wsService.emitLoanStatusUpdate(userId, loanId, 'approved', amount)

// When loan is funded
wsService.emitLoanFunded(userId, loanId, txHash, nftId, amount)
```

## Integration Points

### 1. Dashboard (`/pages/Dashboard.tsx`)
- Real-time loan status updates
- KYC approval notifications
- Connection status indicator
- Live notification feed

### 2. Admin Overview (`/pages/admin/AdminOverview.tsx`)
- New loan request alerts
- Real-time admin notifications
- Unread notification counter
- Live statistics updates

### 3. Loan Routes (`/routes/loans.ts`)
- Emit loan request events
- Notify admins of new applications

### 4. Admin Routes (`/routes/admin.ts`)
- Emit approval/rejection events
- Send funding confirmations
- KYC status updates

## Testing

### WebSocket Test Interface
Access `/test/websocket` (when logged in) for a comprehensive testing interface:
- Connection status monitoring
- Manual connect/disconnect controls
- Test message sending
- Event simulation
- Real-time message logging

## Environment Configuration

### Backend
```env
NODE_ENV=development  # or production
PORT=5001
```

### Frontend
```typescript
// In websocket.ts
const serverUrl = process.env.NODE_ENV === 'production' 
  ? 'wss://your-domain.com' 
  : 'http://localhost:5001'
```

## Dependencies

### Backend
- `socket.io`: WebSocket server implementation
- `jsonwebtoken`: JWT authentication

### Frontend
- `socket.io-client`: WebSocket client
- `react-hot-toast`: Notification system

## Error Handling
- Connection timeout handling
- Automatic reconnection (max 5 attempts)
- Graceful degradation when offline
- Error notifications to users
- Debug logging for development

## Performance Considerations
- Event listener cleanup to prevent memory leaks
- Throttled reconnection attempts
- Efficient event routing based on user roles
- Minimal payload sizes for events

## Security Notes
- JWT tokens required for WebSocket authentication
- Role-based event filtering
- Input validation on all events
- Secure connection protocols (WSS in production)

---

## Quick Start

1. **Backend**: Start the server with `npm run dev`
2. **Frontend**: Start the client with `npm run dev`
3. **Test**: Navigate to `/test/websocket` to verify functionality
4. **Monitor**: Check browser console and server logs for WebSocket events

The WebSocket system will automatically connect when users log in and provide real-time updates throughout the OrbitLend platform experience.
