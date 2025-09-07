import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'
import { toast } from 'react-hot-toast'
import { 
  User, 
  Loan, 
  NFTLoan, 
  ApiResponse, 
  PaginatedResponse, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  LoanRequestData, 
  AdminStats,
  KYCUploadData,
  ProfileUpdateData,
  ChangePasswordData,
  LoanFilters,
  MarketplaceFilters
} from '../types'

class ApiService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const authData = localStorage.getItem('auth-storage')
        if (authData) {
          try {
            const { state } = JSON.parse(authData)
            if (state?.token) {
              config.headers.Authorization = `Bearer ${state.token}`
            }
          } catch (error) {
            console.error('Error parsing auth token:', error)
          }
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('auth-storage')
          window.location.href = '/login'
          toast.error('Session expired. Please login again.')
        } else if (error.response?.status === 403) {
          toast.error('Access denied')
        } else if (error.response?.status && error.response.status >= 500) {
          toast.error('Server error. Please try again later.')
        }
        return Promise.reject(error)
      }
    )
  }

  // Auth endpoints
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', data)
    return response.data
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/register', data)
    return response.data
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.get('/auth/me')
    return response.data
  }

  async changePassword(data: ChangePasswordData): Promise<ApiResponse<null>> {
    const response: AxiosResponse<ApiResponse<null>> = await this.api.put('/auth/change-password', data)
    return response.data
  }

  // User endpoints
  async updateProfile(data: ProfileUpdateData): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.put('/users/profile', data)
    return response.data
  }

  async uploadKYCDocuments(data: KYCUploadData): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.post('/users/kyc/upload', data)
    return response.data
  }

  async getKYCStatus(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/users/kyc/status')
    return response.data
  }

  // Loan endpoints
  async requestLoan(data: LoanRequestData): Promise<ApiResponse<Loan>> {
    const response: AxiosResponse<ApiResponse<Loan>> = await this.api.post('/loans/request', data)
    return response.data
  }

  async getMyLoans(filters: LoanFilters = {}): Promise<PaginatedResponse<Loan>> {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })
    
    const response: AxiosResponse<PaginatedResponse<Loan>> = await this.api.get(`/loans/my-loans?${params}`)
    return response.data
  }

  async getLoanDetails(id: string): Promise<ApiResponse<{ loan: Loan; nft: NFTLoan | null }>> {
    const response: AxiosResponse<ApiResponse<{ loan: Loan; nft: NFTLoan | null }>> = await this.api.get(`/loans/${id}`)
    return response.data
  }

  async makeRepayment(loanId: string, amount: number, installmentNumber?: number): Promise<ApiResponse<Loan>> {
    const response: AxiosResponse<ApiResponse<Loan>> = await this.api.put(`/loans/${loanId}/repayment`, {
      amount,
      installmentNumber
    })
    return response.data
  }

  async getMarketplaceLoans(filters: MarketplaceFilters = {}): Promise<PaginatedResponse<NFTLoan>> {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })
    
    const response: AxiosResponse<PaginatedResponse<NFTLoan>> = await this.api.get(`/loans/marketplace/list?${params}`)
    return response.data
  }

  // NFT endpoints
  async getMyNFTPortfolio(page = 1, limit = 10): Promise<PaginatedResponse<NFTLoan>> {
    const response: AxiosResponse<PaginatedResponse<NFTLoan>> = await this.api.get(`/nfts/my-portfolio?page=${page}&limit=${limit}`)
    return response.data
  }

  async getNFTDetails(id: string): Promise<ApiResponse<NFTLoan>> {
    const response: AxiosResponse<ApiResponse<NFTLoan>> = await this.api.get(`/nfts/${id}`)
    return response.data
  }

  async listNFTOnMarketplace(id: string, listingPrice: number): Promise<ApiResponse<NFTLoan>> {
    const response: AxiosResponse<ApiResponse<NFTLoan>> = await this.api.put(`/nfts/${id}/list`, { listingPrice })
    return response.data
  }

  async unlistNFTFromMarketplace(id: string): Promise<ApiResponse<NFTLoan>> {
    const response: AxiosResponse<ApiResponse<NFTLoan>> = await this.api.put(`/nfts/${id}/unlist`)
    return response.data
  }

  async transferNFT(id: string, fromAddress: string, toAddress: string): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post(`/nfts/${id}/transfer`, {
      fromAddress,
      toAddress
    })
    return response.data
  }

  async verifyNFTOwnership(id: string): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/nfts/${id}/ownership`)
    return response.data
  }

  async browseMarketplace(filters: MarketplaceFilters = {}): Promise<PaginatedResponse<NFTLoan>> {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })
    
    const response: AxiosResponse<PaginatedResponse<NFTLoan>> = await this.api.get(`/nfts/marketplace/browse?${params}`)
    return response.data
  }

  // Admin endpoints
  async getAdminDashboard(): Promise<ApiResponse<AdminStats>> {
    const response: AxiosResponse<ApiResponse<AdminStats>> = await this.api.get('/admin/dashboard')
    return response.data
  }

  async getAdminLoans(filters: LoanFilters = {}): Promise<PaginatedResponse<Loan>> {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })
    
    const response: AxiosResponse<PaginatedResponse<Loan>> = await this.api.get(`/admin/loans?${params}`)
    return response.data
  }

  async approveLoan(loanId: string, walletAddress: string, adminNotes?: string): Promise<ApiResponse<{ loan: Loan; nft: NFTLoan }>> {
    const response: AxiosResponse<ApiResponse<{ loan: Loan; nft: NFTLoan }>> = await this.api.put(`/admin/loans/${loanId}/approve`, {
      walletAddress,
      adminNotes
    })
    return response.data
  }

  async rejectLoan(loanId: string, rejectionReason: string, adminNotes?: string): Promise<ApiResponse<Loan>> {
    const response: AxiosResponse<ApiResponse<Loan>> = await this.api.put(`/admin/loans/${loanId}/reject`, {
      rejectionReason,
      adminNotes
    })
    return response.data
  }

  async getAdminUsers(filters: any = {}): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })
    
    const response: AxiosResponse<PaginatedResponse<User>> = await this.api.get(`/admin/users?${params}`)
    return response.data
  }

  async updateUserKYC(userId: string, action: 'approve' | 'reject', notes?: string): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.put(`/admin/users/${userId}/kyc`, {
      action,
      notes
    })
    return response.data
  }

  async retryNFTMinting(loanId: string, walletAddress: string): Promise<ApiResponse<{ loan: Loan; nft: NFTLoan }>> {
    const response: AxiosResponse<ApiResponse<{ loan: Loan; nft: NFTLoan }>> = await this.api.post(`/admin/nfts/${loanId}/retry-mint`, {
      walletAddress
    })
    return response.data
  }

  async getAllNFTs(filters: any = {}): Promise<PaginatedResponse<NFTLoan>> {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })
    
    const response: AxiosResponse<PaginatedResponse<NFTLoan>> = await this.api.get(`/nfts/admin/all?${params}`)
    return response.data
  }

  // Simple Auth endpoints (no JWT)
  async simpleAuthLogin(data: LoginRequest): Promise<{ user: User }> {
    const response: AxiosResponse<{ user: User }> = await this.api.post('/simple-auth/login', data)
    return response.data
  }

  async simpleAuthRegister(data: RegisterRequest): Promise<{ user: User }> {
    const response: AxiosResponse<{ user: User }> = await this.api.post('/simple-auth/signup', data)
    return response.data
  }

  // Utility methods
  handleApiError(error: AxiosError): string {
    if (error.response?.data && typeof error.response.data === 'object') {
      const errorData = error.response.data as any
      return errorData.error || errorData.message || 'An error occurred'
    }
    return error.message || 'An unexpected error occurred'
  }
}

export const apiService = new ApiService()
export default apiService
