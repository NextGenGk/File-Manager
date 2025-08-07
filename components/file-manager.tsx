'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import GlassCard from '@/components/ui/glass-card'
import LoadingSpinner from '@/components/ui/loading'
import FileItem from '@/components/ui/file-item'
import Breadcrumb from '@/components/ui/breadcrumb'

interface FileItem {
  id: string
  file_name: string
  file_size: number
  content_type: string | null
  uploaded_at: string
  s3_key: string
}

export default function FileManager() {
  const { user } = useUser()
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPath, setCurrentPath] = useState(['Files'])

  const breadcrumbItems = currentPath.map((path, index) => ({
    label: path,
    icon: index === 0 ? '📁' : '📂',
    isActive: index === currentPath.length - 1,
    onClick: index < currentPath.length - 1 ? () => navigateToPath(index) : undefined
  }))

  const navigateToPath = (index: number) => {
    setCurrentPath(currentPath.slice(0, index + 1))
    // Add folder navigation logic here when implementing folders
  }

  const fetchFiles = useCallback(async () => {
    if (!user) return

    try {
      const response = await fetch('/api/objects')
      if (response.ok) {
        const data = await response.json()
        setFiles(data.files || [])
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  const handleDownload = async (file: FileItem) => {
    try {
      const response = await fetch(`/api/download?key=${encodeURIComponent(file.s3_key)}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = file.file_name
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Download error:', error)
      alert('Download failed')
    }
  }

  const handleDelete = async (file: FileItem) => {
    if (!confirm(`Are you sure you want to delete "${file.file_name}"?`)) return

    try {
      const response = await fetch('/api/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: file.s3_key })
      })

      if (response.ok) {
        setFiles(files.filter(f => f.id !== file.id))
        alert('File deleted successfully')
      } else {
        throw new Error('Delete failed')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Delete failed')
    }
  }

  if (!user) return null

  return (
    <GlassCard>
      {/* Breadcrumb Navigation */}
      <div className="p-4 border-b border-white/5">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div>
          <h2 className="text-lg font-semibold text-white">Your Files</h2>
          <p className="text-white/60 text-sm mt-1">
            {files.length} {files.length === 1 ? 'file' : 'files'} stored
          </p>
        </div>

        <button
          onClick={fetchFiles}
          className="px-4 py-2 bg-white/10 text-white text-sm font-medium rounded-md hover:bg-white/20 transition-colors duration-200 border border-white/20"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="p-12">
          <LoadingSpinner size="md" message="Loading your files..." />
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-16 px-6">
          <h3 className="text-lg font-medium text-white mb-2">No files uploaded</h3>
          <p className="text-white/60 text-sm">Upload files using the area above to get started</p>
        </div>
      ) : (
        <div>
          {files.map((file, index) => (
            <FileItem
              key={file.id}
              file={file}
              index={index}
              onDownload={() => handleDownload(file)}
              onDelete={() => handleDelete(file)}
            />
          ))}
        </div>
      )}
    </GlassCard>
  )
}
