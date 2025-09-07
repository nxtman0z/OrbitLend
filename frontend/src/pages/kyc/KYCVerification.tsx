import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from 'react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  User,
  CreditCard,
  DollarSign
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import apiService from '../../services/api'
import type { ApiResponse, User as UserType } from '../../types'

const kycSchema = z.object({
  idDocumentType: z.enum(['passport', 'drivers_license', 'national_id']),
  idDocument: z.instanceof(File).optional(),
  proofOfAddress: z.instanceof(File).optional(),
  proofOfIncome: z.instanceof(File).optional(),
})

type KYCFormData = z.infer<typeof kycSchema>

const KYCVerification = () => {
  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: File}>({})
  const navigate = useNavigate()
  const { user, updateUser } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<KYCFormData>({
    resolver: zodResolver(kycSchema)
  })

  // Fetch current KYC status
  const { isLoading } = useQuery(
    ['kyc-status'],
    () => apiService.getKYCStatus(),
    {
      onError: (error) => {
        console.error('Failed to fetch KYC status:', error)
      }
    }
  )

  const kycMutation = useMutation({
    mutationFn: (data: FormData) => apiService.uploadKYCDocuments(data as any),
    onSuccess: (response: ApiResponse<UserType>) => {
      updateUser(response.data)
      toast.success('KYC documents uploaded successfully!')
      navigate('/dashboard')
    },
    onError: (error: any) => {
      const message = apiService.handleApiError(error)
      toast.error(message)
    }
  })

  const handleFileChange = (field: string, file: File | null) => {
    if (file) {
      setUploadedFiles(prev => ({ ...prev, [field]: file }))
    } else {
      setUploadedFiles(prev => {
        const newFiles = { ...prev }
        delete newFiles[field]
        return newFiles
      })
    }
  }

  const onSubmit = (data: KYCFormData) => {
    const formData = new FormData()
    
    formData.append('idDocumentType', data.idDocumentType)
    
    if (uploadedFiles.idDocument) {
      formData.append('idDocument', uploadedFiles.idDocument)
    }
    if (uploadedFiles.proofOfAddress) {
      formData.append('proofOfAddress', uploadedFiles.proofOfAddress)
    }
    if (uploadedFiles.proofOfIncome) {
      formData.append('proofOfIncome', uploadedFiles.proofOfIncome)
    }

    if (Object.keys(uploadedFiles).length === 0) {
      toast.error('Please upload at least one document')
      return
    }

    kycMutation.mutate(formData)
  }

  const getKycStatusInfo = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          title: 'KYC Verified ✅',
          description: 'Your identity has been verified. You can now access all features.'
        }
      case 'rejected':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          title: 'KYC Rejected ❌',
          description: 'Please resubmit your documents with the corrections requested.'
        }
      case 'pending':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          title: 'KYC Under Review ⏳',
          description: 'Your documents are being reviewed. This usually takes 24-48 hours.'
        }
      default:
        return {
          icon: AlertCircle,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          title: 'KYC Required 📋',
          description: 'Please complete your KYC verification to access all features.'
        }
    }
  }

  const currentStatus = user?.kycStatus || 'pending'
  const statusInfo = getKycStatusInfo(currentStatus)

  const requirementsChecklist = [
    {
      title: 'Government ID',
      description: 'Passport, Driver\'s License, or National ID',
      completed: !!user?.kycDocuments?.idDocument
    },
    {
      title: 'Proof of Address',
      description: 'Utility bill, bank statement (within 3 months)',
      completed: !!user?.kycDocuments?.proofOfAddress
    },
    {
      title: 'Proof of Income',
      description: 'Pay stub, bank statement, tax return',
      completed: !!user?.kycDocuments?.proofOfIncome
    }
  ]

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">KYC Verification</h1>
        <p className="text-gray-600 mt-2">
          Complete your identity verification to access all OrbitLend features
        </p>
      </div>

      {/* Current Status */}
      <div className={`mb-8 p-6 rounded-xl border ${statusInfo.borderColor} ${statusInfo.bgColor}`}>
        <div className="flex items-center">
          <statusInfo.icon className={`h-8 w-8 ${statusInfo.color} mr-4`} />
          <div>
            <h2 className={`text-xl font-bold ${statusInfo.color}`}>{statusInfo.title}</h2>
            <p className="text-gray-700 mt-1">{statusInfo.description}</p>
          </div>
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Requirements Checklist</h3>
        <div className="space-y-4">
          {requirementsChecklist.map((requirement, index) => (
            <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg">
              {requirement.completed ? (
                <CheckCircle className="h-6 w-6 text-green-600 mr-4" />
              ) : (
                <div className="h-6 w-6 border-2 border-gray-300 rounded-full mr-4"></div>
              )}
              <div>
                <p className="font-medium text-gray-900">{requirement.title}</p>
                <p className="text-sm text-gray-600">{requirement.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Form */}
      {currentStatus !== 'approved' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">
            {currentStatus === 'pending' ? 'Update Documents' : 'Upload Documents'}
          </h3>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* ID Document Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID Document Type *
              </label>
              <select
                {...register('idDocumentType')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select document type</option>
                <option value="passport">Passport</option>
                <option value="drivers_license">Driver's License</option>
                <option value="national_id">National ID</option>
              </select>
              {errors.idDocumentType && (
                <p className="mt-1 text-sm text-red-600">{errors.idDocumentType.message}</p>
              )}
            </div>

            {/* File Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* ID Document */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Government ID *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange('idDocument', e.target.files?.[0] || null)}
                    className="hidden"
                    id="idDocument"
                  />
                  <label htmlFor="idDocument" className="cursor-pointer">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {uploadedFiles.idDocument ? uploadedFiles.idDocument.name : 'Click to upload'}
                    </p>
                  </label>
                </div>
              </div>

              {/* Proof of Address */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Proof of Address
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange('proofOfAddress', e.target.files?.[0] || null)}
                    className="hidden"
                    id="proofOfAddress"
                  />
                  <label htmlFor="proofOfAddress" className="cursor-pointer">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {uploadedFiles.proofOfAddress ? uploadedFiles.proofOfAddress.name : 'Click to upload'}
                    </p>
                  </label>
                </div>
              </div>

              {/* Proof of Income */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Proof of Income
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange('proofOfIncome', e.target.files?.[0] || null)}
                    className="hidden"
                    id="proofOfIncome"
                  />
                  <label htmlFor="proofOfIncome" className="cursor-pointer">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {uploadedFiles.proofOfIncome ? uploadedFiles.proofOfIncome.name : 'Click to upload'}
                    </p>
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={kycMutation.isLoading || Object.keys(uploadedFiles).length === 0}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {kycMutation.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Submit Documents
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Benefits Section */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Benefits of KYC Verification</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <User className="h-6 w-6 text-blue-600 mr-3" />
            <span className="text-gray-700">Enhanced Security</span>
          </div>
          <div className="flex items-center">
            <CreditCard className="h-6 w-6 text-blue-600 mr-3" />
            <span className="text-gray-700">Access to Loans</span>
          </div>
          <div className="flex items-center">
            <DollarSign className="h-6 w-6 text-blue-600 mr-3" />
            <span className="text-gray-700">Higher Limits</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default KYCVerification
