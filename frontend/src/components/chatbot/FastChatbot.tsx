import { useState, useRef, useEffect } from 'react'
import { useMutation } from 'react-query'
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User as UserIcon, 
  X,
  Minimize2,
  RotateCcw,
  Zap,
  Brain,
  Clock
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  confidence?: number
  source?: 'cache' | 'training' | 'ai'
  processingTime?: number
}

interface ChatbotProps {
  isOpen: boolean
  onToggle: () => void
  userId?: string
  userName?: string
}

const FastChatbot = ({ isOpen, onToggle, userName }: ChatbotProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Focus input when chatbot opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, isMinimized])

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `Hello${userName ? ` ${userName}` : ''}! 👋 Welcome to OrbitLend Assistant. I'm here to help you with:

• **Loan Applications** - Apply for loans, check status, understand requirements
• **NFT Marketplace** - Trade NFT-backed loans, understand collateral process  
• **Account Management** - KYC verification, profile settings, security
• **Technical Support** - Platform navigation and troubleshooting

What can I help you with today?`,
        timestamp: new Date(),
        confidence: 1.0,
        source: 'training'
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen, userName, messages.length])

  // Chat mutation with enhanced response handling
  const chatMutation = useMutation(
    async (message: string) => {
      const response = await fetch('http://localhost:5001/api/chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          message,
          sessionId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      return response.json()
    },
    {
      onSuccess: (data) => {
        const assistantMessage: ChatMessage = {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: data.data.response,
          timestamp: new Date(),
          confidence: data.data.confidence,
          source: data.data.source,
          processingTime: data.data.processingTime
        }
        setMessages(prev => [...prev, assistantMessage])
      },
      onError: (error: any) => {
        toast.error('Failed to send message. Please try again.')
        console.error('Chat error:', error)
      }
    }
  )

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || chatMutation.isLoading) return

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')

    // Send to chatbot
    chatMutation.mutate(inputMessage.trim())
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    toast.success('Chat cleared!')
  }

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-400'
    if (confidence >= 0.9) return 'text-green-500'
    if (confidence >= 0.7) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'cache':
        return <div title="Cached Response"><Zap className="w-3 h-3 text-blue-500" /></div>
      case 'training':
        return <div title="Training Data"><Brain className="w-3 h-3 text-green-500" /></div>
      case 'ai':
        return <div title="AI Generated"><Bot className="w-3 h-3 text-purple-500" /></div>
      default:
        return null
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover:scale-110"
      >
        <MessageCircle className="w-6 h-6" />
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
      </button>
    )
  }

  return (
    <div className={`fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300 ${
      isMinimized ? 'h-16' : 'h-[600px]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">OrbitLend Assistant</h3>
            <p className="text-xs text-blue-100">Fast AI Training • Instant Help</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-white/20 rounded"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-white/20 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: 'calc(600px - 140px)' }}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.role === 'assistant' && (
                      <Bot className="w-4 h-4 mt-0.5 text-blue-600" />
                    )}
                    {message.role === 'user' && (
                      <UserIcon className="w-4 h-4 mt-0.5 text-white" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      
                      {/* Metadata for assistant messages */}
                      {message.role === 'assistant' && (message.confidence || message.source || message.processingTime) && (
                        <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-gray-200">
                          {message.source && getSourceIcon(message.source)}
                          
                          {message.confidence && (
                            <span className={`text-xs ${getConfidenceColor(message.confidence)}`}>
                              {Math.round(message.confidence * 100)}%
                            </span>
                          )}
                          
                          {message.processingTime && (
                            <div className="flex items-center space-x-1 text-gray-400">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs">{message.processingTime}ms</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {chatMutation.isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3 max-w-[85%]">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4 text-blue-600" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={clearChat}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear chat"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about OrbitLend..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={chatMutation.isLoading}
                />
              </div>
              
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || chatMutation.isLoading}
                className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xs text-gray-400 mt-2 text-center">
              Powered by Fast AI Training • Response time: ~{chatMutation.data?.data?.processingTime || 200}ms
            </p>
          </div>
        </>
      )}
    </div>
  )
}

export default FastChatbot
