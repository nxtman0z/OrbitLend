import { useState } from 'react'
import { Camera, Upload } from 'lucide-react'

interface ProfileImageProps {
  currentImage?: string
  userName: string
  onImageUpdate: (file: File) => void
  size?: 'sm' | 'md' | 'lg'
}

const ProfileImage = ({ currentImage, userName, onImageUpdate, size = 'lg' }: ProfileImageProps) => {
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setIsUploading(true)
    try {
      await onImageUpdate(file)
    } catch (error) {
      console.error('Error uploading image:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getImageUrl = (url: string) => {
    if (!url) return ''
    
    // If URL is already full URL, return as is
    if (url.startsWith('http')) return url
    
    // If relative URL, construct full URL
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    return `${baseUrl}${url}`
  }

  return (
    <div className="relative group">
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg shadow-lg overflow-hidden`}>
        {currentImage ? (
          <img
            src={`${getImageUrl(currentImage)}?t=${Date.now()}`}
            alt={userName}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Failed to load profile picture:', currentImage)
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <span>{getInitials(userName)}</span>
        )}
      </div>
      
      {/* Upload overlay */}
      <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
        <label className="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
          {isUploading ? (
            <Upload className="w-6 h-6 text-white animate-pulse" />
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
        </label>
      </div>
    </div>
  )
}

export default ProfileImage
