// API Types
export interface User {
  _id: string
  email: string
  firstName: string
  lastName: string
  role: 'user' | 'admin'
  phone?: string
  phoneNumber?: string
  profilePicture?: string
  address?: string | {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  kycStatus: 'pending' | 'approved' | 'rejected'
  kyc?: {
    status: 'pending' | 'approved' | 'rejected'
    documents?: {
      idDocument?: string
      proofOfAddress?: string
      proofOfIncome?: string
      uploadDate: string
    }
  }
  kycDocuments?: {
    idDocument?: string
    proofOfAddress?: string
    proofOfIncome?: string
    uploadDate: string
  }
  walletAddress?: string
  isWalletUser?: boolean
  isActive: boolean
  fullName: string
  createdAt: string
  updatedAt: string
}

export interface Loan {
  _id: string
  userId: string | User
  amount: number
  purpose: string
  interestRate: number
  termMonths: number
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'defaulted'
  requestDate: string
  approvalDate?: string
  rejectionDate?: string
  rejectionReason?: string
  collateral?: {
    type: string
    value: number
    description: string
  }
  documents?: {
    incomeProof?: string
    collateralProof?: string
    businessPlan?: string
    uploadDate: string
  }
  adminNotes?: string
  approvedBy?: string | User
  nftTokenId?: string
  nftContractAddress?: string
  nftTransactionHash?: string
  repaymentSchedule?: RepaymentInstallment[]
  totalRepaid: number
  remainingBalance: number
  monthlyPayment?: number
  totalInterest?: number
  createdAt: string
  updatedAt: string
}

export interface RepaymentInstallment {
  installmentNumber: number
  dueDate: string
  amount: number
  principalAmount: number
  interestAmount: number
  status: 'pending' | 'paid' | 'overdue'
  paidDate?: string
  paidAmount?: number
}

export interface NFTLoan {
  _id: string
  loanId: string | Loan
  tokenId: string
  contractAddress: string
  transactionHash: string
  blockNumber?: number
  ownerAddress: string
  previousOwners: Array<{
    address: string
    transferDate: string
    transferTxHash: string
  }>
  metadata: {
    name: string
    description: string
    image?: string
    attributes: Array<{
      trait_type: string
      value: string | number
    }>
    loanDetails: {
      amount: number
      interestRate: number
      termMonths: number
      purpose: string
      status: string
      approvalDate: string
    }
  }
  verbwireData: {
    ipfsHash?: string
    quickNodeUrl?: string
    mintedAt: string
    network: string
  }
  marketplaceStatus: 'not_listed' | 'listed' | 'sold'
  listingPrice?: number
  listingDate?: string
  isActive: boolean
  marketplaceUrl?: string
  explorerUrl?: string
  createdAt: string
  updatedAt: string
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
  warning?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: {
    [key: string]: T[]
  } & {
    pagination: {
      currentPage: number
      totalPages: number
      totalLoans?: number
      totalUsers?: number
      totalNFTs?: number
      limit: number
    }
  }
  message: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  role?: 'user' | 'admin'
  phone?: string
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  walletAddress?: string
}

export interface AuthResponse {
  success: boolean
  data: {
    user: User
    token: string
  }
  message: string
}

export interface LoanRequestData {
  amount: number
  purpose: string
  interestRate: number
  termMonths: number
  collateral?: {
    type: string
    value: number
    description: string
  }
}

export interface AdminStats {
  users: {
    total: number
    pendingKYC: number
  }
  loans: {
    total: number
    pending: number
    approved: number
    active: number
    totalAmount: number
  }
  nfts: {
    total: number
  }
}

// Form Types
export interface KYCUploadData {
  idDocument?: string
  proofOfAddress?: string
  proofOfIncome?: string
}

export interface ProfileUpdateData {
  firstName?: string
  lastName?: string
  phone?: string
  phoneNumber?: string
  profilePicture?: string
  address?: string | {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  walletAddress?: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

export interface LoanFilters {
  page?: number
  limit?: number
  status?: string
  userId?: string
  minAmount?: number
  maxAmount?: number
  purpose?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface MarketplaceFilters {
  page?: number
  limit?: number
  minAmount?: number
  maxAmount?: number
  purpose?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Error Types
export interface ApiError {
  message: string
  status?: number
  code?: string
}

// Loan Purposes
export const LOAN_PURPOSES = [
  { value: 'personal', label: 'Personal' },
  { value: 'business', label: 'Business' },
  { value: 'education', label: 'Education' },
  { value: 'home_improvement', label: 'Home Improvement' },
  { value: 'debt_consolidation', label: 'Debt Consolidation' },
  { value: 'medical', label: 'Medical' },
  { value: 'investment', label: 'Investment' },
  { value: 'other', label: 'Other' }
] as const

// Loan Status Colors
export const LOAN_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  defaulted: 'bg-red-100 text-red-800'
} as const

// KYC Status Colors
export const KYC_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
} as const
