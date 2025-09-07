import { useState } from 'react'
import { useWebSocket } from '../../hooks/useWebSocket'
import { wsService } from '../../services/websocket'

const WebSocketTest = () => {
  const { isConnected, isConnecting, error, connectionId, connect, disconnect, ping } = useWebSocket({
    autoConnect: false
  })
  
  const [testMessage, setTestMessage] = useState('')
  const [receivedMessages, setReceivedMessages] = useState<Array<{
    event: string
    data: any
    timestamp: Date
  }>>([])

  const handleTestEvent = () => {
    if (isConnected) {
      // Emit a test event
      wsService.emit('test:message', { 
        message: testMessage || 'Hello from frontend!',
        timestamp: new Date()
      })
      
      setTestMessage('')
    }
  }

  const handleManualConnect = async () => {
    try {
      await connect()
    } catch (error) {
      console.error('Manual connection failed:', error)
    }
  }

  // Listen for test responses
  wsService.on('test:response' as any, (data: any) => {
    setReceivedMessages(prev => [...prev, {
      event: 'test:response',
      data,
      timestamp: new Date()
    }])
  })

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">WebSocket Test Interface</h2>
        
        {/* Connection Status */}
        <div className="mb-6 p-4 rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-3">Connection Status</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Status:</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                isConnected 
                  ? 'bg-green-100 text-green-800' 
                  : isConnecting 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {isConnected ? '🟢 Connected' : isConnecting ? '🟡 Connecting...' : '🔴 Disconnected'}
              </span>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Connection ID:</p>
              <p className="text-sm font-mono bg-gray-200 px-2 py-1 rounded">
                {connectionId || 'None'}
              </p>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800 text-sm">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}
        </div>

        {/* Connection Controls */}
        <div className="mb-6 p-4 rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-3">Connection Controls</h3>
          
          <div className="flex space-x-3">
            <button
              onClick={handleManualConnect}
              disabled={isConnected || isConnecting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Connect
            </button>
            
            <button
              onClick={disconnect}
              disabled={!isConnected}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Disconnect
            </button>
            
            <button
              onClick={ping}
              disabled={!isConnected}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Ping Server
            </button>
          </div>
        </div>

        {/* Test Message */}
        <div className="mb-6 p-4 rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-3">Send Test Message</h3>
          
          <div className="flex space-x-3">
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Enter test message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <button
              onClick={handleTestEvent}
              disabled={!isConnected}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Test
            </button>
          </div>
        </div>

        {/* Simulate Real Events */}
        <div className="mb-6 p-4 rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-3">Simulate Real Events</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => wsService.emit('simulate:loan:request', { 
                amount: 5000, 
                purpose: 'Business expansion',
                userId: 'user123'
              })}
              disabled={!isConnected}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              Simulate Loan Request
            </button>
            
            <button
              onClick={() => wsService.emit('simulate:loan:approval', { 
                loanId: 'loan123',
                status: 'approved',
                amount: 5000
              })}
              disabled={!isConnected}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Simulate Loan Approval
            </button>
            
            <button
              onClick={() => wsService.emit('simulate:kyc:approval', { 
                userId: 'user123',
                status: 'approved'
              })}
              disabled={!isConnected}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              Simulate KYC Approval
            </button>
            
            <button
              onClick={() => wsService.emit('simulate:loan:funded', { 
                loanId: 'loan123',
                amount: 5000,
                nftId: 'nft456',
                txHash: '0x123...'
              })}
              disabled={!isConnected}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              Simulate Loan Funding
            </button>
          </div>
        </div>

        {/* Received Messages */}
        <div className="p-4 rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-3">Received Messages</h3>
          
          <div className="max-h-64 overflow-y-auto space-y-2">
            {receivedMessages.length === 0 ? (
              <p className="text-gray-500 text-sm">No messages received yet...</p>
            ) : (
              receivedMessages.slice(-10).reverse().map((msg, index) => (
                <div key={index} className="bg-white p-3 rounded border">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm text-blue-600">{msg.event}</p>
                      <pre className="text-xs text-gray-700 mt-1 whitespace-pre-wrap">
                        {JSON.stringify(msg.data, null, 2)}
                      </pre>
                    </div>
                    <span className="text-xs text-gray-500">
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {receivedMessages.length > 0 && (
            <button
              onClick={() => setReceivedMessages([])}
              className="mt-3 px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Clear Messages
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default WebSocketTest
