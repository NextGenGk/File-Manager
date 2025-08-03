'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export default function GlassCard({ children, className = '', hover = true }: GlassCardProps) {
  return (
    <motion.div
      className={`
        relative border border-white/10 rounded-xl backdrop-blur-sm
        bg-gradient-to-br from-white/5 to-white/10
        ${hover ? 'hover:border-white/20 hover:from-white/10 hover:to-white/15' : ''}
        transition-all duration-300 ${className}
      `}
      whileHover={hover ? { y: -2 } : undefined}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  )
}
