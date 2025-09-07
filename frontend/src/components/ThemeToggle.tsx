import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

interface ThemeToggleProps {
  className?: string
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle ${className}`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="absolute inset-0 flex items-center justify-center transition-all duration-300">
        <Sun 
          className={`w-4 h-4 text-amber-500 transition-all duration-300 ${
            theme === 'dark' ? 'opacity-0 scale-50' : 'opacity-100 scale-100'
          }`} 
        />
        <Moon 
          className={`w-4 h-4 text-slate-700 absolute transition-all duration-300 ${
            theme === 'dark' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
          }`} 
        />
      </div>
    </button>
  )
}

export default ThemeToggle
