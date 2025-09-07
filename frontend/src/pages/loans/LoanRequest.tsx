import { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { apiService } from '../../services/api'
import { toast } from 'react-hot-toast'
import { DollarSign, Clock, Percent, FileText, ImageIcon, Upload } from 'lucide-react'
import type { LoanRequestData } from '../../types'

const LoanRequest = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<LoanRequestData>({
    amount: 0,
    purpose: '',
    interestRate: 5,
    termMonths: 1,
    collateral: {
      type: 'nft',
      value: 0,
      description: ''
    }
  })

  const [step, setStep] = useState(1)
  const [imageUrls, setImageUrls] = useState<string[]>([])

  const requestLoanMutation = useMutation(
    (data: LoanRequestData) => apiService.requestLoan(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('my-loans')
        toast.success('Loan request submitted successfully!')
        navigate('/loans/my-loans')
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Failed to submit loan request')
      }
    }
  )

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('collateral.')) {
      const collateralField = field.replace('collateral.', '')
      setFormData(prev => ({ 
        ...prev, 
        collateral: { 
          ...prev.collateral!, 
          [collateralField]: value 
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const urls = Array.from(files).map(file => URL.createObjectURL(file))
      setImageUrls(prev => [...prev, ...urls])
    }
  }

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (step < 3) {
      setStep(step + 1)
      return
    }
    requestLoanMutation.mutate(formData)
  }

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.amount > 0 && formData.purpose.trim() !== ''
      case 2:
        return formData.interestRate > 0 && formData.termMonths > 0
      case 3:
        return formData.collateral?.description.trim() !== '' && (formData.collateral?.value || 0) > 0
      default:
        return false
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Request a Loan</h1>
        <p className="text-gray-600">Complete the form below to submit your loan request</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= stepNum ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {stepNum}
              </div>
              <span className={`ml-2 text-sm ${
                step >= stepNum ? 'text-blue-600 font-medium' : 'text-gray-500'
              }`}>
                {stepNum === 1 ? 'Loan Details' : stepNum === 2 ? 'Terms' : 'Collateral'}
              </span>
              {stepNum < 3 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  step > stepNum ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6">
        {/* Step 1: Loan Details */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Loan Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="inline w-4 h-4 mr-1" />
                  Loan Amount (ETH)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount || ''}
                  onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="inline w-4 h-4 mr-1" />
                  Loan Purpose
                </label>
                <select
                  value={formData.purpose}
                  onChange={(e) => handleInputChange('purpose', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select purpose</option>
                  <option value="Business Investment">Business Investment</option>
                  <option value="NFT Purchase">NFT Purchase</option>
                  <option value="DeFi Trading">DeFi Trading</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Personal">Personal</option>
                  <option value="Education">Education</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Purpose Details
              </label>
              <textarea
                value={formData.purpose.includes('Other') ? formData.purpose.replace('Other', '').trim() : ''}
                onChange={(e) => {
                  if (formData.purpose === 'Other') {
                    handleInputChange('purpose', `Other: ${e.target.value}`)
                  }
                }}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Provide additional details about your loan purpose..."
              />
            </div>
          </div>
        )}

        {/* Step 2: Terms */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Loan Terms</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Percent className="inline w-4 h-4 mr-1" />
                  Proposed Interest Rate (% APR)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.interestRate || ''}
                  onChange={(e) => handleInputChange('interestRate', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="5.0"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Lower rates may increase approval chances</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline w-4 h-4 mr-1" />
                  Loan Duration (months)
                </label>
                <select
                  value={formData.termMonths}
                  onChange={(e) => handleInputChange('termMonths', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value={1}>1 month</option>
                  <option value={2}>2 months</option>
                  <option value={3}>3 months</option>
                  <option value={6}>6 months</option>
                  <option value={12}>12 months</option>
                  <option value={24}>24 months</option>
                </select>
              </div>
            </div>

            {/* Loan Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Loan Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Principal:</span>
                  <span className="font-medium ml-2">{formData.amount} ETH</span>
                </div>
                <div>
                  <span className="text-gray-600">Interest Rate:</span>
                  <span className="font-medium ml-2">{formData.interestRate}% APR</span>
                </div>
                <div>
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium ml-2">{formData.termMonths} months</span>
                </div>
                <div>
                  <span className="text-gray-600">Est. Total Repayment:</span>
                  <span className="font-medium ml-2">
                    {(formData.amount * (1 + (formData.interestRate / 100) * (formData.termMonths / 12))).toFixed(4)} ETH
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Collateral */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Collateral Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collateral Type
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="nft"
                    checked={formData.collateral?.type === 'nft'}
                    onChange={(e) => handleInputChange('collateral.type', e.target.value)}
                    className="mr-2"
                  />
                  NFT Collection
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="other"
                    checked={formData.collateral?.type === 'other'}
                    onChange={(e) => handleInputChange('collateral.type', e.target.value)}
                    className="mr-2"
                  />
                  Other Digital Asset
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Collateral Description
                </label>
                <textarea
                  value={formData.collateral?.description || ''}
                  onChange={(e) => handleInputChange('collateral.description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={formData.collateral?.type === 'nft' 
                    ? "e.g., Bored Ape Yacht Club #1234, CryptoPunks #5678..."
                    : "Describe your digital asset collateral..."
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="inline w-4 h-4 mr-1" />
                  Estimated Collateral Value (ETH)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.collateral?.value || ''}
                  onChange={(e) => handleInputChange('collateral.value', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Collateral should be worth at least {(formData.amount * 1.5).toFixed(2)} ETH (150% of loan)
                </p>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ImageIcon className="inline w-4 h-4 mr-1" />
                Collateral Images/Screenshots
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Upload collateral images
                      </span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                    <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 10MB each</p>
                  </div>
                </div>
              </div>

              {/* Uploaded Images Preview */}
              {imageUrls.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Collateral ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Collateral Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">
                    Important Notice
                  </h3>
                  <div className="mt-2 text-sm text-amber-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Your collateral will be held in escrow until loan repayment</li>
                      <li>Failure to repay may result in collateral liquidation</li>
                      <li>Ensure accurate valuation of your collateral assets</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 mt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <button
            type="submit"
            disabled={!isStepValid() || requestLoanMutation.isLoading}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {requestLoanMutation.isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            ) : step === 3 ? (
              'Submit Loan Request'
            ) : (
              'Next'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default LoanRequest
