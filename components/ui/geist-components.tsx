'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GeistCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  glass?: boolean
}

export function GeistCard({ children, className, hover = true, glass = false }: GeistCardProps) {
  return (
    <motion.div
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm geist-transition",
        hover && "hover:shadow-md hover:scale-[1.02]",
        glass && "geist-glass",
        className
      )}
      whileHover={hover ? { scale: 1.02 } : {}}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  )
}

interface GeistButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
  disabled?: boolean
}

export function GeistButton({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className, 
  onClick,
  disabled = false 
}: GeistButtonProps) {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium geist-transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
  
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground"
  }
  
  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 py-2",
    lg: "h-11 px-8 text-lg"
  }

  return (
    <motion.button
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      transition={{ duration: 0.15 }}
    >
      {children}
    </motion.button>
  )
}

interface GeistInputProps {
  type?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  className?: string
  disabled?: boolean
}

export function GeistInput({ 
  type = "text", 
  placeholder, 
  value, 
  onChange, 
  className,
  disabled = false 
}: GeistInputProps) {
  return (
    <motion.input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 geist-transition",
        className
      )}
      whileFocus={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    />
  )
}

interface GeistBadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  className?: string
}

export function GeistBadge({ children, variant = 'default', className }: GeistBadgeProps) {
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
    outline: "text-foreground border border-input"
  }

  return (
    <motion.div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold geist-transition focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  )
}

interface GeistProgressProps {
  value: number
  max?: number
  className?: string
}

export function GeistProgress({ value, max = 100, className }: GeistProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={cn("w-full bg-secondary rounded-full h-2 overflow-hidden", className)}>
      <motion.div
        className="h-full bg-primary rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  )
}
