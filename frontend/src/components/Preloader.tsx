import React, { useState, useEffect } from 'react'

interface PreloaderProps {
  onComplete?: () => void
  duration?: number
}

const Preloader: React.FC<PreloaderProps> = ({ onComplete, duration = 2500 }) => {
  const [isVisible, setIsVisible] = useState(true)
  const [loadingText, setLoadingText] = useState('Loading')

  useEffect(() => {
    // Animate loading text
    const textInterval = setInterval(() => {
      setLoadingText(prev => {
        if (prev === 'Loading...') return 'Loading'
        return prev + '.'
      })
    }, 500)

    // Hide preloader after duration
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => {
        onComplete?.()
      }, 500) // Wait for fade out animation
    }, duration)

    return () => {
      clearInterval(textInterval)
      clearTimeout(timer)
    }
  }, [duration, onComplete])

  if (!isVisible) {
    return (
      <div className="preloader hidden">
        <img 
          src="/logo-optimized.jpg" 
          alt="OrbitLend Logo" 
          className="preloader-logo"
        />
        <div className="preloader-spinner"></div>
        <div className="preloader-text">
          {loadingText}
          <span className="preloader-dots"></span>
        </div>
      </div>
    )
  }

  return (
    <div className="preloader">
      <img 
        src="/logo-optimized.jpg" 
        alt="OrbitLend Logo" 
        className="preloader-logo"
      />
      <div className="preloader-spinner"></div>
      <div className="preloader-text">
        {loadingText}
        <span className="preloader-dots"></span>
      </div>
    </div>
  )
}

export default Preloader
