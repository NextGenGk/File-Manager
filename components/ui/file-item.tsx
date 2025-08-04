'use client'

import { motion } from 'framer-motion'

interface FileItemProps {
  file: {
    id: string
    file_name: string
    file_size: number
    content_type: string | null
    uploaded_at: string
    s3_key: string
  }
  index: number
  onDownload: () => void
  onDelete: () => void
}

const getFileType = (contentType: string | null) => {
  if (!contentType) return 'File'
  
  if (contentType.startsWith('image/')) return 'Image'
  if (contentType.startsWith('video/')) return 'Video'
  if (contentType.startsWith('audio/')) return 'Audio'
  if (contentType.includes('pdf')) return 'PDF'
  if (contentType.includes('text')) return 'Text'
  if (contentType.includes('zip') || contentType.includes('rar')) return 'Archive'
  
  return 'File'
}

const formatFileSize = (bytes: number) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 Bytes'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

export default function FileItem({ file, index, onDownload, onDelete }: FileItemProps) {
  return (
    <motion.div
      className="flex items-center justify-between p-4 hover:bg-white/5 transition-all duration-200 group border-b border-white/5 last:border-b-0"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ x: 4 }}
    >
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        <div className="w-12 h-8 bg-white/10 rounded-md flex items-center justify-center">
          <span className="text-xs font-medium text-white/80">
            {getFileType(file.content_type)}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium truncate text-white group-hover:text-blue-300 transition-colors duration-200">
            {file.file_name}
          </p>
          <div className="flex items-center space-x-3 text-xs text-white/50 mt-1">
            <span className="bg-white/10 px-2 py-0.5 rounded-md">
              {formatFileSize(file.file_size)}
            </span>
            <span>{formatDate(file.uploaded_at)}</span>
            {file.content_type && (
              <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md">
                {file.content_type.split('/')[1]?.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <motion.button
          onClick={onDownload}
          className="px-3 py-1.5 bg-green-500/20 text-green-300 text-xs font-medium rounded-md hover:bg-green-500/30 transition-colors duration-200 border border-green-500/30"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Download
        </motion.button>
        <motion.button
          onClick={onDelete}
          className="px-3 py-1.5 bg-red-500/20 text-red-300 text-xs font-medium rounded-md hover:bg-red-500/30 transition-colors duration-200 border border-red-500/30"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Delete
        </motion.button>
      </div>
    </motion.div>
  )
}
