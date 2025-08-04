'use client'

import { motion } from 'framer-motion'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
}

export default function LoadingSpinner({ size = 'md', message }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <motion.div 
        className={`animate-spin rounded-full border-2 border-white/20 border-t-white ${sizeClasses[size]}`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      {message && (
        <motion.p 
          className="text-white/70 text-sm font-medium"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {message}
        </motion.p>
      )}
    </div>
  )
}
