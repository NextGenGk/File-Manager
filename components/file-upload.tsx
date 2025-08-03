'use client'

import { useState, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import GlassCard from '@/components/ui/glass-card'
import LoadingSpinner from '@/components/ui/loading'

interface FileUploadProps {
  onUploadSuccess?: () => void
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const { user } = useUser()
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList) => {
    if (!files.length || !user) return

    setUploading(true)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('bucket', 'general-s3-ui')

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Upload failed')
        }
      }

      onUploadSuccess?.()
      alert(`Successfully uploaded ${files.length} file(s)!`)
    } catch (error) {
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)

    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  if (!user) {
    return null
  }

  return (
    <GlassCard className="p-6">
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 cursor-pointer transition-all duration-300
          ${dragActive 
            ? 'border-blue-400/60 bg-blue-500/10' 
            : 'border-white/20 hover:border-white/40'
          }
          ${uploading ? 'opacity-50 pointer-events-none' : 'hover:bg-white/5'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <div className="text-center space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {uploading ? 'Uploading Files...' : dragActive ? 'Drop Files Here' : 'Upload Files'}
            </h3>
            <p className="text-white/60 text-sm">
              {uploading
                ? 'Please wait while your files are being uploaded'
                : dragActive
                  ? 'Release to upload your files'
                  : 'Drag and drop files here or click to browse'
              }
            </p>
          </div>

          {uploading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <button className="px-6 py-3 bg-white/10 text-white font-medium rounded-md hover:bg-white/20 transition-colors duration-200 border border-white/20">
              Choose Files
            </button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </GlassCard>
  )
}
