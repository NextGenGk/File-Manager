'use client'

import { motion } from 'framer-motion'

interface BreadcrumbProps {
  items: Array<{
    label: string
    icon?: string
    isActive?: boolean
    onClick?: () => void
  }>
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <motion.nav
      className="flex items-center space-x-2 text-sm"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          {index > 0 && <span className="text-white/30">/</span>}
          <motion.div 
            className={`flex items-center space-x-1 transition-colors duration-200 ${
              item.isActive 
                ? 'text-blue-300' 
                : item.onClick 
                ? 'text-white/60 hover:text-white cursor-pointer' 
                : 'text-white/60'
            }`}
            onClick={item.onClick}
            whileHover={item.onClick ? { scale: 1.05 } : {}}
            whileTap={item.onClick ? { scale: 0.95 } : {}}
          >
            {item.icon && <span className="text-base">{item.icon}</span>}
            <span className="font-medium">{item.label}</span>
          </motion.div>
        </div>
      ))}
    </motion.nav>
  )
}
