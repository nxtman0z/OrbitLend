// OrbitLend Chatbot Knowledge Base
export interface QAPair {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
}

export interface KnowledgeCategory {
  name: string;
  description: string;
  priority: number;
}

// Core Knowledge Categories
export const knowledgeCategories: KnowledgeCategory[] = [
  { name: 'loans', description: 'Loan applications, approval, and management', priority: 1 },
  { name: 'nft', description: 'NFT-backed loans and marketplace', priority: 2 },
  { name: 'kyc', description: 'KYC verification and compliance', priority: 3 },
  { name: 'profile', description: 'Profile management and settings', priority: 4 },
  { name: 'payments', description: 'Payments, transactions, and billing', priority: 5 },
  { name: 'technical', description: 'Technical support and troubleshooting', priority: 6 }
];

// Fast Training Dataset - Curated Q&A Pairs
export const trainingData: QAPair[] = [
  // Loan Management
  {
    id: 'loan_001',
    question: 'How do I apply for a loan?',
    answer: 'To apply for a loan on OrbitLend: 1) Complete your KYC verification, 2) Go to "Apply for Loan" in your dashboard, 3) Fill out the loan application form with amount, purpose, and terms, 4) Submit required documents, 5) Wait for admin approval (usually 24-48 hours).',
    category: 'loans',
    keywords: ['apply', 'loan', 'application', 'how to', 'process']
  },
  {
    id: 'loan_002',
    question: 'What is the maximum loan amount I can get?',
    answer: 'Loan amounts depend on your KYC status and creditworthiness. Generally: Basic users: up to $5,000, Verified users: up to $25,000, Premium users: up to $100,000. Your exact limit is shown in your dashboard after KYC approval.',
    category: 'loans',
    keywords: ['maximum', 'limit', 'amount', 'loan', 'how much']
  },
  {
    id: 'loan_003',
    question: 'How long does loan approval take?',
    answer: 'Loan approval typically takes 24-48 hours for verified users. The process involves: 1) Automated initial review (instant), 2) Admin manual review (24-48 hours), 3) Final approval and fund disbursement (same day after approval).',
    category: 'loans',
    keywords: ['approval', 'time', 'how long', 'processing', 'review']
  },

  // NFT & Marketplace
  {
    id: 'nft_001',
    question: 'How do NFT-backed loans work?',
    answer: 'NFT-backed loans use your NFTs as collateral: 1) Connect your wallet, 2) Select NFTs to use as collateral, 3) Get loan amount based on NFT value (typically 50-70%), 4) If you repay on time, your NFTs are returned. If you default, OrbitLend can sell the NFTs to recover the loan.',
    category: 'nft',
    keywords: ['nft', 'collateral', 'backed', 'how it works', 'marketplace']
  },
  {
    id: 'nft_002',
    question: 'Can I trade NFT loans in the marketplace?',
    answer: 'Yes! Our marketplace allows you to: 1) List your loan-backed NFTs for sale, 2) Browse and purchase NFT loans from other users, 3) Set your own prices and terms, 4) Complete secure transactions through smart contracts.',
    category: 'nft',
    keywords: ['marketplace', 'trade', 'buy', 'sell', 'nft loans']
  },

  // KYC & Verification
  {
    id: 'kyc_001',
    question: 'What documents do I need for KYC verification?',
    answer: 'For KYC verification, please provide: 1) Government-issued photo ID (passport, driver\'s license), 2) Proof of address (utility bill, bank statement from last 3 months), 3) Proof of income (pay stub, tax return, bank statements). All documents must be clear, recent, and in English.',
    category: 'kyc',
    keywords: ['kyc', 'documents', 'verification', 'required', 'id']
  },
  {
    id: 'kyc_002',
    question: 'How long does KYC verification take?',
    answer: 'KYC verification usually takes 1-3 business days. Status updates: Submitted → Under Review → Approved/Rejected. You\'ll receive email notifications at each stage. If rejected, we\'ll specify what additional documents are needed.',
    category: 'kyc',
    keywords: ['kyc', 'time', 'verification', 'how long', 'status']
  },

  // Profile & Settings
  {
    id: 'profile_001',
    question: 'How do I upload my profile picture?',
    answer: 'To upload your profile picture: 1) Go to Profile Settings, 2) Click "Edit Profile", 3) Click the camera icon on your profile picture, 4) Select an image file (max 5MB, JPG/PNG), 5) Click "Save" to update your profile.',
    category: 'profile',
    keywords: ['profile', 'picture', 'upload', 'photo', 'avatar']
  },
  {
    id: 'profile_002',
    question: 'How do I change my password?',
    answer: 'To change your password: 1) Go to Profile Settings, 2) Click on "Security Settings", 3) Enter your current password, 4) Enter your new password (minimum 6 characters), 5) Confirm new password, 6) Click "Update Password".',
    category: 'profile',
    keywords: ['password', 'change', 'security', 'update', 'reset']
  },

  // Technical Support
  {
    id: 'tech_001',
    question: 'Why is the marketplace loading slowly?',
    answer: 'Marketplace slowness can be due to: 1) High network traffic, 2) Large dataset loading. We\'ve optimized the system with caching and pagination. Try refreshing the page or clearing your browser cache. If issues persist, contact support.',
    category: 'technical',
    keywords: ['slow', 'loading', 'marketplace', 'performance', 'lag']
  }
];

// System Prompts and Context
export const systemPrompts = {
  base: `You are OrbitLend Assistant, a helpful AI chatbot for the OrbitLend decentralized lending platform. 

PLATFORM CONTEXT:
- OrbitLend is a Web3 lending platform specializing in NFT-backed loans
- Users can apply for traditional loans or use NFTs as collateral
- Platform features: loan applications, KYC verification, NFT marketplace, profile management
- Users need KYC verification for most features

PERSONALITY:
- Be helpful, professional, and concise
- Use simple language, avoid jargon
- Always be encouraging and solution-focused
- If unsure, offer to connect with human support

RESPONSE GUIDELINES:
- Keep responses under 150 words
- Use numbered lists for step-by-step instructions
- Include relevant timeframes when applicable
- Always end with "Need more help? I'm here to assist!"`,

  fallback: `I don't have specific information about that topic right now. However, I'd be happy to help you with:

• Loan applications and approval process
• NFT-backed loans and marketplace
• KYC verification requirements
• Profile and security settings
• General platform navigation

Would you like me to connect you with our support team for more detailed assistance? They're available 24/7 to help with specific account issues.

Need more help? I'm here to assist!`,

  greeting: `Hello! 👋 Welcome to OrbitLend Assistant. I'm here to help you with:

• **Loan Applications** - Apply for loans, check status, understand requirements
• **NFT Marketplace** - Trade NFT-backed loans, understand collateral process
• **Account Management** - KYC verification, profile settings, security
• **Technical Support** - Platform navigation and troubleshooting

What can I help you with today?`
};

// Context Injection Templates
export const contextTemplates = {
  loanContext: `CURRENT USER CONTEXT: This user is asking about loans. Key points:
- Users need completed KYC for loan applications
- Loan amounts vary by verification level
- Approval takes 24-48 hours typically
- Both traditional and NFT-backed loans available`,

  nftContext: `CURRENT USER CONTEXT: This user is asking about NFTs. Key points:
- NFTs can be used as loan collateral
- Marketplace allows trading of NFT loans
- Smart contracts ensure secure transactions
- Wallet connection required for NFT features`,

  kycContext: `CURRENT USER CONTEXT: This user is asking about KYC. Key points:
- KYC required for most platform features
- Need government ID, proof of address, proof of income
- Verification takes 1-3 business days
- Status updates sent via email`,

  profileContext: `CURRENT USER CONTEXT: This user is asking about profile management. Key points:
- Profile picture upload available in settings
- Password changes in security section
- Two-factor authentication recommended
- Account settings affect loan limits`
};

export default {
  trainingData,
  systemPrompts,
  contextTemplates,
  knowledgeCategories
};
