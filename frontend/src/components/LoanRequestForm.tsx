import { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { 
  DollarSign,
  Shield,
  Send,
  AlertCircle
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { apiService } from '../services/api'

interface LoanRequestForm {
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

interface FormErrors {
  amount?: string
  purpose?: string
  interestRate?: string
  termMonths?: string
  collateralType?: string
  collateralValue?: string
  collateralDescription?: string
}

const LoanRequestForm = () => {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<LoanRequestForm>({
    amount: 0,
    purpose: '',
    interestRate: 8.5,
    termMonths: 12,
    collateral: {
      type: '',
      value: 0,
      description: ''
    }
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [hasCollateral, setHasCollateral] = useState(false)

  const loanPurposes = [
    { value: 'personal', label: 'Personal' },
    { value: 'business', label: 'Business' },
    { value: 'education', label: 'Education' },
    { value: 'home_improvement', label: 'Home Improvement' },
    { value: 'debt_consolidation', label: 'Debt Consolidation' },
    { value: 'medical', label: 'Medical' },
    { value: 'investment', label: 'Investment' },
    { value: 'other', label: 'Other' }
  ]

  const requestLoanMutation = useMutation(
    (loanData: LoanRequestForm) => apiService.requestLoan(loanData),
    {
      onSuccess: () => {
        toast.success('Loan request submitted successfully! You will be notified when it\'s reviewed.')
        queryClient.invalidateQueries(['my-loans'])
        // Reset form
        setFormData({
          amount: 0,
          purpose: '',
          interestRate: 8.5,
          termMonths: 12,
          collateral: { type: '', value: 0, description: '' }
        })
        setErrors({})
        setHasCollateral(false)
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Failed to submit loan request')
      }
    }
  )

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Loan amount must be greater than 0'
    } else if (formData.amount < 1000) {
      newErrors.amount = 'Minimum loan amount is $1,000'
    } else if (formData.amount > 1000000) {
      newErrors.amount = 'Maximum loan amount is $1,000,000'
    }

    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Loan purpose is required'
    }

    if (!formData.interestRate || formData.interestRate < 0.1) {
      newErrors.interestRate = 'Interest rate must be at least 0.1%'
    } else if (formData.interestRate > 50) {
      newErrors.interestRate = 'Interest rate cannot exceed 50%'
    }

    if (!formData.termMonths || formData.termMonths < 1) {
      newErrors.termMonths = 'Loan term must be at least 1 month'
    } else if (formData.termMonths > 360) {
      newErrors.termMonths = 'Loan term cannot exceed 360 months'
    }

    if (hasCollateral && formData.collateral) {
      if (!formData.collateral.type.trim()) {
        newErrors.collateralType = 'Collateral type is required'
      }
      if (!formData.collateral.value || formData.collateral.value <= 0) {
        newErrors.collateralValue = 'Collateral value must be greater than 0'
      }
      if (!formData.collateral.description.trim()) {
        newErrors.collateralDescription = 'Collateral description is required'
      }
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

    const submitData = {
      ...formData,
      collateral: hasCollateral ? formData.collateral : undefined
    }

    requestLoanMutation.mutate(submitData)
  }

  const handleInputChange = (field: keyof LoanRequestForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleCollateralChange = (field: keyof NonNullable<LoanRequestForm['collateral']>, value: any) => {
    setFormData(prev => ({
      ...prev,
      collateral: {
        ...prev.collateral!,
        [field]: value
      }
    }))
    
    // Clear collateral errors
    const collateralErrorFields = ['collateralType', 'collateralValue', 'collateralDescription']
    if (collateralErrorFields.includes(`collateral${field.charAt(0).toUpperCase() + field.slice(1)}`)) {
      setErrors(prev => ({ ...prev, [`collateral${field.charAt(0).toUpperCase() + field.slice(1)}`]: undefined }))
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

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center mb-6">
        <DollarSign className="h-6 w-6 text-blue-600 mr-3" />
        <h2 className="text-xl font-semibold text-gray-900">Request a Loan</h2>
      </div>

      {/* Loan Calculator Preview */}
      {formData.amount > 0 && formData.interestRate > 0 && formData.termMonths > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Loan Preview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-blue-700">Monthly Payment</p>
              <p className="text-xl font-bold text-blue-900">
                {formatCurrency(calculateMonthlyPayment())}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Total Interest</p>
              <p className="text-xl font-bold text-blue-900">
                {formatCurrency((calculateMonthlyPayment() * formData.termMonths) - formData.amount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Total Repayment</p>
              <p className="text-xl font-bold text-blue-900">
                {formatCurrency(calculateMonthlyPayment() * formData.termMonths)}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Loan Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loan Amount (USD) *
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
              className={`input-field ${errors.amount ? 'border-red-300' : ''}`}
              placeholder="10000"
              min="1000"
              max="1000000"
              step="0.01"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Minimum: $1,000 | Maximum: $1,000,000</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loan Purpose *
            </label>
            <select
              value={formData.purpose}
              onChange={(e) => handleInputChange('purpose', e.target.value)}
              className={`input-field ${errors.purpose ? 'border-red-300' : ''}`}
            >
              <option value="">Select purpose</option>
              {loanPurposes.map((purpose) => (
                <option key={purpose.value} value={purpose.value}>
                  {purpose.label}
                </option>
              ))}
            </select>
            {errors.purpose && (
              <p className="mt-1 text-sm text-red-600">{errors.purpose}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Desired Interest Rate (%) *
            </label>
            <input
              type="number"
              value={formData.interestRate}
              onChange={(e) => handleInputChange('interestRate', parseFloat(e.target.value) || 0)}
              className={`input-field ${errors.interestRate ? 'border-red-300' : ''}`}
              placeholder="8.5"
              min="0.1"
              max="50"
              step="0.1"
            />
            {errors.interestRate && (
              <p className="mt-1 text-sm text-red-600">{errors.interestRate}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Rate range: 0.1% - 50%</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loan Term (Months) *
            </label>
            <input
              type="number"
              value={formData.termMonths}
              onChange={(e) => handleInputChange('termMonths', parseInt(e.target.value) || 0)}
              className={`input-field ${errors.termMonths ? 'border-red-300' : ''}`}
              placeholder="12"
              min="1"
              max="360"
            />
            {errors.termMonths && (
              <p className="mt-1 text-sm text-red-600">{errors.termMonths}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Term range: 1 - 360 months</p>
          </div>
        </div>

        {/* Collateral Section */}
        <div className="border-t pt-6">
          <div className="flex items-center mb-4">
            <Shield className="h-5 w-5 text-purple-600 mr-2" />
            <label className="flex items-center text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={hasCollateral}
                onChange={(e) => setHasCollateral(e.target.checked)}
                className="mr-2"
              />
              Add Collateral (Optional - may improve approval chances)
            </label>
          </div>

          {hasCollateral && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-7">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Collateral Type *
                </label>
                <input
                  type="text"
                  value={formData.collateral?.type || ''}
                  onChange={(e) => handleCollateralChange('type', e.target.value)}
                  className={`input-field ${errors.collateralType ? 'border-red-300' : ''}`}
                  placeholder="Real Estate, Vehicle, Stocks, etc."
                />
                {errors.collateralType && (
                  <p className="mt-1 text-sm text-red-600">{errors.collateralType}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Value (USD) *
                </label>
                <input
                  type="number"
                  value={formData.collateral?.value || 0}
                  onChange={(e) => handleCollateralChange('value', parseFloat(e.target.value) || 0)}
                  className={`input-field ${errors.collateralValue ? 'border-red-300' : ''}`}
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
                  value={formData.collateral?.description || ''}
                  onChange={(e) => handleCollateralChange('description', e.target.value)}
                  className={`input-field ${errors.collateralDescription ? 'border-red-300' : ''}`}
                  rows={3}
                  placeholder="Detailed description of the collateral including condition, location, etc."
                />
                {errors.collateralDescription && (
                  <p className="mt-1 text-sm text-red-600">{errors.collateralDescription}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Important Notice:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Your loan request will be reviewed by our admin team</li>
                <li>You'll receive real-time notifications about your application status</li>
                <li>Upon approval, an NFT will be minted representing your loan</li>
                <li>Ensure your KYC is complete to avoid delays</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={requestLoanMutation.isLoading}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {requestLoanMutation.isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Submit Loan Request
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default LoanRequestForm
