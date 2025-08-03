'use client'

import React from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <div className="animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
    </div>
  )
}

interface LoadingPageProps {
  message?: string
}

export const LoadingPage: React.FC<LoadingPageProps> = ({
  message = 'Loading...'
}) => (
  <div className="min-h-screen flex items-center justify-center bg-black">
    <div className="text-center">
      <LoadingSpinner size="lg" className="mx-auto mb-4" />
      <p className="text-white/80 text-lg">{message}</p>
    </div>
  </div>
)

interface LoadingOverlayProps {
  isVisible: boolean
  message?: string
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = 'Processing...'
}) => {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-white text-lg">{message}</p>
      </div>
    </div>
  )
}
