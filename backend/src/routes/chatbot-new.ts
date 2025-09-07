import express, { Request, Response } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth'
import FastChatbotService from '../services/FastChatbotService'
import User from '../models/User'
import Loan from '../models/Loan'

const router = express.Router()

// Initialize Fast Chatbot Service
const chatbotService = new FastChatbotService()

// Store active sessions (in production, use Redis or database)
const activeSessions = new Map<string, { userId?: string; lastActivity: Date }>()

// Clean up old sessions every hour
setInterval(() => {
  chatbotService.clearOldSessions(24) // Clear sessions older than 24 hours
  
  // Clean up our session tracking
  const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000)
  for (const [sessionId, session] of activeSessions.entries()) {
    if (session.lastActivity < cutoffTime) {
      activeSessions.delete(sessionId)
    }
  }
}, 60 * 60 * 1000) // Run every hour

// Get enhanced user context for personalized responses
const getUserContext = async (userId: string) => {
  try {
    const user = await User.findById(userId).select('firstName lastName email kycStatus walletAddress profilePicture')
    const loans = await Loan.find({ user: userId }).select('amount status purpose createdAt')
    
    return {
      user: user ? {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        kycStatus: user.kycStatus || 'pending',
        hasWallet: !!user.walletAddress,
        hasProfilePicture: !!user.profilePicture
      } : null,
      loans: {
        total: loans.length,
        active: loans.filter(loan => loan.status === 'active').length,
        pending: loans.filter(loan => loan.status === 'pending').length,
        completed: loans.filter(loan => loan.status === 'completed').length,
        recent: loans.slice(-3).map(loan => ({
          amount: loan.amount,
          status: loan.status,
          purpose: loan.purpose,
          date: loan.createdAt
        }))
      }
    }
  } catch (error) {
    console.error('Error fetching user context:', error)
    return { user: null, loans: { total: 0, active: 0, pending: 0, completed: 0, recent: [] } }
  }
}

/**
 * @route   POST /api/chatbot/chat
 * @desc    Process chat message with fast AI training
 * @access  Public/Private
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, sessionId = 'anonymous' } = req.body
    
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required and must be a non-empty string'
      })
    }

    // Get user ID from auth if available
    const userId = (req as AuthRequest).user?._id?.toString()
    
    // Update session tracking
    activeSessions.set(sessionId, {
      userId,
      lastActivity: new Date()
    })

    // Get user context for personalized responses
    let userContext = ''
    if (userId) {
      const context = await getUserContext(userId)
      if (context.user) {
        userContext = `User Context: ${context.user.name} (KYC: ${context.user.kycStatus}, Loans: ${context.loans.total} total, ${context.loans.active} active)`
      }
    }

    // Process message with fast chatbot service
    const result = await chatbotService.processMessage(
      message,
      sessionId,
      userId
    )

    // Add user context to response if available
    let enhancedResponse = result.response
    if (userContext && result.confidence < 0.9) {
      // Add contextual hints for low-confidence responses
      if (message.toLowerCase().includes('loan') && userId) {
        const context = await getUserContext(userId)
        if (context.loans.pending > 0) {
          enhancedResponse += `\n\n💡 I see you have ${context.loans.pending} pending loan application(s). You can check their status in your dashboard.`
        }
      }
    }

    res.json({
      success: true,
      data: {
        response: enhancedResponse,
        confidence: result.confidence,
        source: result.source,
        processingTime: result.processingTime,
        sessionId
      }
    })

  } catch (error) {
    console.error('Chat processing error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to process chat message',
      error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
    })
  }
})

/**
 * @route   GET /api/chatbot/history/:sessionId
 * @desc    Get chat history for a session
 * @access  Public/Private
 */
router.get('/history/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params
    const history = chatbotService.getChatHistory(sessionId)
    
    res.json({
      success: true,
      data: {
        sessionId,
        messages: history,
        messageCount: history.length
      }
    })
  } catch (error) {
    console.error('Error fetching chat history:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat history'
    })
  }
})

/**
 * @route   DELETE /api/chatbot/session/:sessionId
 * @desc    Clear chat session
 * @access  Public/Private
 */
router.delete('/session/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params
    
    // Remove from our tracking
    activeSessions.delete(sessionId)
    
    res.json({
      success: true,
      message: 'Chat session cleared successfully'
    })
  } catch (error) {
    console.error('Error clearing chat session:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to clear chat session'
    })
  }
})

/**
 * @route   GET /api/chatbot/stats
 * @desc    Get chatbot performance statistics
 * @access  Private (Admin)
 */
router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      })
    }

    const stats = chatbotService.getStats()
    const activeSessionsCount = activeSessions.size
    
    res.json({
      success: true,
      data: {
        chatbot: stats,
        activeSessions: activeSessionsCount,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error fetching chatbot stats:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chatbot statistics'
    })
  }
})

/**
 * @route   POST /api/chatbot/training/add
 * @desc    Add new training data
 * @access  Private (Admin)
 */
router.post('/training/add', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      })
    }

    const { question, answer, category, keywords } = req.body
    
    if (!question || !answer || !category) {
      return res.status(400).json({
        success: false,
        message: 'Question, answer, and category are required'
      })
    }

    const qaPair = {
      id: `custom_${Date.now()}`,
      question: question.trim(),
      answer: answer.trim(),
      category: category.trim(),
      keywords: keywords ? keywords.map((k: string) => k.trim()) : []
    }

    chatbotService.addTrainingData(qaPair)
    
    res.json({
      success: true,
      message: 'Training data added successfully',
      data: qaPair
    })
  } catch (error) {
    console.error('Error adding training data:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to add training data'
    })
  }
})

/**
 * @route   GET /api/chatbot/health
 * @desc    Chatbot health check
 * @access  Public
 */
router.get('/health', (req: Request, res: Response) => {
  const stats = chatbotService.getStats()
  
  res.json({
    success: true,
    status: 'healthy',
    data: {
      service: 'FastChatbotService',
      trainingDataSize: stats.trainingDataSize,
      cacheSize: stats.cacheSize,
      activeSessions: activeSessions.size,
      timestamp: new Date().toISOString()
    }
  })
})

export default router
