import { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { 
  PlusCircle, 
  FileText,
  DollarSign,
  User,
  Coins
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { apiService } from '../../services/api'

interface AdminLoanRequest {
  borrowerEmail: string
  amount: number
  purpose: string
  interestRate: number
  termMonths: number
  collateralType: string
  collateralDescription: string
  collateralValue: number
  priority: 'low' | 'medium' | 'high'
  notes: string
}

interface FormErrors {
  borrowerEmail?: string
  amount?: string
  purpose?: string
  interestRate?: string
  termMonths?: string
  collateralType?: string
  collateralDescription?: string
  collateralValue?: string
  priority?: string
  notes?: string
}

const AdminRequestLoan = () => {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<AdminLoanRequest>({
    borrowerEmail: '',
    amount: 0,
    purpose: '',
    interestRate: 8.5,
    termMonths: 12,
    collateralType: '',
    collateralDescription: '',
    collateralValue: 0,
    priority: 'medium',
    notes: ''
  })

  const [errors, setErrors] = useState<FormErrors>({})

  const createLoanMutation = useMutation(
    (loanData: AdminLoanRequest) => apiService.requestLoan(loanData), // Will need admin-specific endpoint
    {
      onSuccess: () => {
        toast.success('Admin loan request created successfully!')
        queryClient.invalidateQueries(['admin-loans'])
        // Reset form
        setFormData({
          borrowerEmail: '',
          amount: 0,
          purpose: '',
          interestRate: 8.5,
          termMonths: 12,
          collateralType: '',
          collateralDescription: '',
          collateralValue: 0,
          priority: 'medium',
          notes: ''
        })
        setErrors({})
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Failed to create loan request')
      }
    }
  )

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.borrowerEmail) {
      newErrors.borrowerEmail = 'Borrower email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.borrowerEmail)) {
      newErrors.borrowerEmail = 'Please enter a valid email address'
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Loan amount must be greater than 0'
    }

    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Loan purpose is required'
    }

    if (!formData.interestRate || formData.interestRate < 0) {
      newErrors.interestRate = 'Interest rate must be 0 or greater'
    }

    if (!formData.termMonths || formData.termMonths <= 0) {
      newErrors.termMonths = 'Loan term must be greater than 0'
    }

    if (!formData.collateralType.trim()) {
      newErrors.collateralType = 'Collateral type is required'
    }

    if (!formData.collateralDescription.trim()) {
      newErrors.collateralDescription = 'Collateral description is required'
    }

    if (!formData.collateralValue || formData.collateralValue <= 0) {
      newErrors.collateralValue = 'Collateral value must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    createLoanMutation.mutate(formData)
  }

  const handleInputChange = (field: keyof AdminLoanRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const calculateMonthlyPayment = () => {
    const { amount, interestRate, termMonths } = formData
    if (amount && interestRate && termMonths) {
      const monthlyRate = interestRate / 100 / 12
      const payment = (amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                      (Math.pow(1 + monthlyRate, termMonths) - 1)
      return payment
    }
    return 0
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Admin Loan Request</h1>
        <p className="text-gray-600 mt-2">
          Create a loan request on behalf of a borrower with administrative privileges
        </p>
      </div>

      {/* Loan Calculator Card */}
      {formData.amount > 0 && formData.interestRate > 0 && formData.termMonths > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Loan Calculation</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-blue-700">Monthly Payment</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(calculateMonthlyPayment())}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Total Interest</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency((calculateMonthlyPayment() * formData.termMonths) - formData.amount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Total Repayment</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(calculateMonthlyPayment() * formData.termMonths)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Borrower Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <User className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Borrower Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Borrower Email *
              </label>
              <input
                type="email"
                value={formData.borrowerEmail}
                onChange={(e) => handleInputChange('borrowerEmail', e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.borrowerEmail ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="borrower@example.com"
              />
              {errors.borrowerEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.borrowerEmail}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority Level
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <div className="mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${getPriorityColor(formData.priority)}`}>
                  {formData.priority} Priority
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Loan Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <DollarSign className="h-6 w-6 text-green-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Loan Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan Amount *
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.amount ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="10000"
                min="0"
                step="0.01"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interest Rate (%) *
              </label>
              <input
                type="number"
                value={formData.interestRate}
                onChange={(e) => handleInputChange('interestRate', parseFloat(e.target.value) || 0)}
                className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.interestRate ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="8.5"
                min="0"
                step="0.1"
              />
              {errors.interestRate && (
                <p className="mt-1 text-sm text-red-600">{errors.interestRate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan Term (Months) *
              </label>
              <input
                type="number"
                value={formData.termMonths}
                onChange={(e) => handleInputChange('termMonths', parseInt(e.target.value) || 0)}
                className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.termMonths ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="12"
                min="1"
              />
              {errors.termMonths && (
                <p className="mt-1 text-sm text-red-600">{errors.termMonths}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan Purpose *
              </label>
              <textarea
                value={formData.purpose}
                onChange={(e) => handleInputChange('purpose', e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.purpose ? 'border-red-300' : 'border-gray-300'
                }`}
                rows={3}
                placeholder="Describe the purpose of this loan..."
              />
              {errors.purpose && (
                <p className="mt-1 text-sm text-red-600">{errors.purpose}</p>
              )}
            </div>
          </div>
        </div>

        {/* Collateral Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <Coins className="h-6 w-6 text-purple-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Collateral Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collateral Type *
              </label>
              <input
                type="text"
                value={formData.collateralType}
                onChange={(e) => handleInputChange('collateralType', e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.collateralType ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Real Estate, Vehicle, etc."
              />
              {errors.collateralType && (
                <p className="mt-1 text-sm text-red-600">{errors.collateralType}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collateral Value *
              </label>
              <input
                type="number"
                value={formData.collateralValue}
                onChange={(e) => handleInputChange('collateralValue', parseFloat(e.target.value) || 0)}
                className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.collateralValue ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="15000"
                min="0"
                step="0.01"
              />
              {errors.collateralValue && (
                <p className="mt-1 text-sm text-red-600">{errors.collateralValue}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collateral Description *
              </label>
              <textarea
                value={formData.collateralDescription}
                onChange={(e) => handleInputChange('collateralDescription', e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.collateralDescription ? 'border-red-300' : 'border-gray-300'
                }`}
                rows={3}
                placeholder="Detailed description of the collateral..."
              />
              {errors.collateralDescription && (
                <p className="mt-1 text-sm text-red-600">{errors.collateralDescription}</p>
              )}
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <FileText className="h-6 w-6 text-gray-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Additional Notes</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Any additional notes or special considerations for this loan request..."
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              setFormData({
                borrowerEmail: '',
                amount: 0,
                purpose: '',
                interestRate: 8.5,
                termMonths: 12,
                collateralType: '',
                collateralDescription: '',
                collateralValue: 0,
                priority: 'medium',
                notes: ''
              })
              setErrors({})
            }}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Reset Form
          </button>
          <button
            type="submit"
            disabled={createLoanMutation.isLoading}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {createLoanMutation.isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              <>
                <PlusCircle className="w-5 h-5 mr-2" />
                Create Loan Request
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AdminRequestLoan
