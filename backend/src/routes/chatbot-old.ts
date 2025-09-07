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

// Get user context for personalized responses
const getUserContext = async (userId: string) => {
  try {
    const user = await User.findById(userId).select('firstName lastName email kycStatus walletAddress')
    const loans = await Loan.find({ user: userId }).select('amount status purpose createdAt')
    
    return {
      user: user ? {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        kycStatus: user.kycStatus || 'pending',
        hasWallet: !!user.walletAddress
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

// Get or create chat session for user
const getChatSession = (userId: string) => {
  if (!chatSessions.has(userId)) {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ 
            text: `You are OrbitLend AI Assistant, an expert in decentralized lending and blockchain finance. You work for OrbitLend, a cutting-edge DeFi lending platform.

PLATFORM OVERVIEW:
OrbitLend is a decentralized lending platform that allows users to:
- Borrow funds using NFT collateral
- Lend money to earn interest
- Trade NFT-backed loans in a marketplace
- Complete KYC verification for enhanced features
- Connect multiple wallet types (MetaMask, WalletConnect, etc.)

KEY FEATURES YOU SHOULD KNOW:

1. LOAN SYSTEM:
- Users can apply for loans with NFT collateral
- Loan amounts: $1,000 - $100,000
- Interest rates: 5% - 25% APR based on risk assessment
- Terms: 6 months to 5 years
- Purposes: Business, Personal, Education, Medical, Real Estate
- Automatic NFT minting upon loan approval
- Real-time loan status tracking
- Repayment scheduling and notifications

2. KYC VERIFICATION:
- Required for loans above $10,000
- Documents needed: ID, Address proof, Income verification
- Processing time: 24-48 hours
- Status levels: Pending, Approved, Rejected
- Enhanced features after approval

3. WALLET INTEGRATION:
- MetaMask (primary)
- WalletConnect for mobile wallets
- Hardware wallet support (Ledger, Trezor)
- Multi-chain support (Ethereum, Polygon, BSC)
- Automatic balance detection
- Transaction history tracking

4. NFT MARKETPLACE:
- Buy/sell NFT-backed loans
- Loan risk assessment scores
- Portfolio diversification tools
- Real-time market data
- Automated trading features

5. DASHBOARD FEATURES:
- Portfolio overview with charts
- Active loans management
- Payment reminders and scheduling
- Credit score tracking
- Investment opportunities
- Real-time notifications

6. ADMIN FEATURES:
- Loan approval/rejection workflow
- Risk assessment tools
- User management
- Market oversight
- Compliance monitoring

COMMON USER SCENARIOS:
- New user onboarding and wallet connection
- Loan application process and requirements
- KYC verification assistance
- Payment issues and scheduling
- Portfolio management questions
- Technical troubleshooting
- Feature explanations and navigation

TONE & STYLE:
- Professional yet friendly
- Clear and concise explanations
- Use specific platform terminology
- Provide step-by-step guidance
- Always mention relevant dashboard sections
- Include helpful tips and best practices
- Acknowledge limitations when necessary

Remember: You represent OrbitLend's commitment to making DeFi lending accessible, secure, and user-friendly.` }]
        },
        {
          role: 'model',
          parts: [{ 
            text: `Hello! I'm your OrbitLend AI Assistant, and I'm here to help you navigate our decentralized lending platform. 

I can assist you with:
🏦 **Loan Applications** - Guide you through applying for loans with NFT collateral
💎 **NFT Marketplace** - Help you understand loan trading and investment opportunities  
🔐 **KYC Verification** - Walk you through the identity verification process
💳 **Wallet Connection** - Troubleshoot wallet issues and explain multi-chain support
📊 **Portfolio Management** - Help you track loans, payments, and investments
⚙️ **Platform Features** - Explain dashboard sections and advanced tools

Whether you're new to DeFi lending or looking to optimize your OrbitLend experience, I'm here to provide expert guidance tailored to our platform. What would you like to explore today?` }]
        }
      ],
      generationConfig: {
        maxOutputTokens: 2000,
        temperature: 0.8,
        topP: 0.9,
        topK: 40,
      },
    })
    chatSessions.set(userId, chat)
  }
  return chatSessions.get(userId)
}

// POST /api/chatbot/message
router.post('/message', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { message } = req.body
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
    }

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a string'
      })
    }

    // Get or create chat session for this user
    const chat = getChatSession(userId)

    // Get user context for personalized responses
    const userContext = await getUserContext(userId)

    // Add context about the user's dashboard
    const contextualMessage = `USER QUERY: "${message}"

CURRENT USER CONTEXT:
- User: ${userContext.user?.name || 'User'} (${userContext.user?.email || 'No email'})
- KYC Status: ${userContext.user?.kycStatus || 'Unknown'}
- Wallet Connected: ${userContext.user?.hasWallet ? 'Yes' : 'No'}
- Platform: OrbitLend Decentralized Lending Platform

USER'S LOAN PORTFOLIO:
- Total Loans: ${userContext.loans.total}
- Active Loans: ${userContext.loans.active}
- Pending Applications: ${userContext.loans.pending}
- Completed Loans: ${userContext.loans.completed}
${userContext.loans.recent.length > 0 ? `
Recent Loans:
${userContext.loans.recent.map(loan => `  • $${loan.amount} for ${loan.purpose} (${loan.status})`).join('\n')}` : ''}

AVAILABLE DASHBOARD SECTIONS:
1. Portfolio Overview (/dashboard) - Main stats, charts, recent activity
2. Loan Applications (/loans/request) - Apply for new loans
3. My Loans (/loans/my-loans) - Active loans, payment history
4. KYC Verification (/kyc) - Identity verification center
5. NFT Marketplace (/marketplace) - Trade NFT-backed loans
6. Portfolio Analytics (/portfolio) - Detailed investment tracking
7. Profile Settings (/profile) - Account management, security

PERSONALIZED SUGGESTIONS BASED ON USER STATUS:
${userContext.user?.kycStatus === 'pending' ? '- Consider completing KYC verification for higher loan limits' : ''}
${userContext.loans.pending > 0 ? '- You have pending loan applications to track' : ''}
${!userContext.user?.hasWallet ? '- Connect your wallet to access full platform features' : ''}
${userContext.loans.active > 0 ? '- Monitor your active loans for payment schedules' : ''}

QUICK HELP TOPICS:
- Loan Application Process: Requirements, documentation, approval timeline
- KYC Issues: Document requirements, processing delays, rejection reasons
- Wallet Problems: Connection issues, transaction failures, balance sync
- Payment Scheduling: Auto-pay setup, manual payments, late fees
- Platform Navigation: Finding features, understanding dashboard
- Investment Strategies: Risk assessment, portfolio diversification
- Technical Support: Browser issues, mobile app, troubleshooting

Please provide a helpful, specific response that:
1. Directly addresses the user's query
2. Uses their personal context when relevant
3. References appropriate OrbitLend dashboard sections
4. Includes step-by-step guidance when appropriate
5. Uses our platform terminology
6. Offers personalized suggestions based on their status

Response should be professional, clear, and actionable.`

    // Send message to Gemini
    const result = await chat.sendMessage(contextualMessage)
    const response = await result.response
    const text = response.text()

    return res.json({
      success: true,
      data: {
        message: text,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Chatbot error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to process message'
    })
  }
})

// GET /api/chatbot/history
router.get('/history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
    }

    const chat = chatSessions.get(userId)
    
    if (!chat) {
      return res.json({
        success: true,
        data: {
          messages: []
        }
      })
    }

    // In a real implementation, you'd store and retrieve chat history from database
    return res.json({
      success: true,
      data: {
        messages: []
      }
    })

  } catch (error) {
    console.error('Chat history error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve chat history'
    })
  }
})

// DELETE /api/chatbot/clear
router.delete('/clear', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
    }

    chatSessions.delete(userId)

    return res.json({
      success: true,
      message: 'Chat history cleared'
    })

  } catch (error) {
    console.error('Clear chat error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to clear chat history'
    })
  }
})

// GET /api/chatbot/knowledge
router.get('/knowledge', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    return res.json({
      success: true,
      data: platformKnowledge
    })
  } catch (error) {
    console.error('Knowledge base error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve knowledge base'
    })
  }
})

export default router
