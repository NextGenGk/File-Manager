'use client'

import { useState, useCallback, useEffect } from 'react'
import { Upload, Folder, File, Trash2, Download, Plus, Search, ChevronRight, Home as HomeIcon, RefreshCw, Clock, HardDrive } from 'lucide-react'

interface FileItem {
  Key: string
  Name: string
  Type: 'file' | 'folder'
  Size?: number
  LastModified?: string
}

export default function FileManager() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [currentPath, setCurrentPath] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Fetch files from S3
  const fetchFiles = async (prefix: string = '') => {
    setLoading(true)
    try {
      const response = await fetch(`/api/objects?prefix=${encodeURIComponent(prefix)}&bucket=general-s3-ui`)
      const data = await response.json()

      if (data.status === 'success') {
        setFiles(data.items)
        setCurrentPath(prefix)
      }
    } catch (error) {
      console.error('Error fetching files:', error)
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  // Load files on component mount
  useEffect(() => {
    fetchFiles('')
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    uploadFiles(droppedFiles)
  }, [currentPath])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      uploadFiles(selectedFiles)
    }
  }

  const uploadFiles = async (newFiles: File[]) => {
    setUploading(true)
    try {
      console.log('Uploading files:', newFiles.map(f => f.name))

      // Upload each file to S3
      const uploadPromises = newFiles.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('prefix', currentPath)
        formData.append('bucket', 'general-s3-ui')

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Upload failed')
        }

        return await response.json()
      })

      // Wait for all uploads to complete
      const results = await Promise.all(uploadPromises)
      console.log('Upload results:', results)

      // Refresh the file list after upload
      await fetchFiles(currentPath)
    } catch (error) {
      console.error('Error uploading files:', error)
      // You might want to show a toast notification here
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleFolderClick = (folderKey: string) => {
    fetchFiles(folderKey)
  }

  const handleBreadcrumbClick = (path: string) => {
    fetchFiles(path)
  }

  const handleDelete = async (fileItem: FileItem) => {
    const confirmMessage = fileItem.Type === 'folder'
      ? `Are you sure you want to delete the folder "${fileItem.Name}" and all its contents? This action cannot be undone.`
      : `Are you sure you want to delete "${fileItem.Name}"? This action cannot be undone.`

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const response = await fetch(`/api/delete?key=${encodeURIComponent(fileItem.Key)}&type=${fileItem.Type}&bucket=general-s3-ui`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Delete failed')
      }

      const result = await response.json()
      console.log('Delete result:', result)

      // Refresh the file list after deletion
      await fetchFiles(currentPath)
    } catch (error) {
      console.error('Error deleting item:', error)
      alert(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleDownload = async (fileItem: FileItem) => {
    try {
      // Get presigned URL for download
      const response = await fetch(`/api/download?key=${encodeURIComponent(fileItem.Key)}&bucket=general-s3-ui&method=presigned`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Download failed')
      }

      const result = await response.json()

      // Open the presigned URL in a new tab/window to trigger download
      const link = document.createElement('a')
      link.href = result.downloadUrl
      link.download = result.fileName
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

    } catch (error) {
      console.error('Error downloading file:', error)
      alert(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Generate breadcrumb paths
  const getBreadcrumbs = () => {
    if (!currentPath) return []

    const parts = currentPath.split('/').filter(Boolean)
    const breadcrumbs = []
    let currentBreadcrumbPath = ''

    for (let i = 0; i < parts.length; i++) {
      currentBreadcrumbPath += parts[i] + '/'
      breadcrumbs.push({
        name: parts[i],
        path: currentBreadcrumbPath
      })
    }

    return breadcrumbs
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredFiles = files.filter(file =>
    file.Name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">File Manager</h1>
              <p className="text-lg text-gray-600 font-medium">Organize and manage your cloud storage files</p>
            </div>
            <button
              onClick={() => fetchFiles(currentPath)}
              disabled={loading}
              className="flex items-center space-x-2 px-5 py-2.5 bg-white/70 backdrop-blur-sm border border-gray-200/80 rounded-xl hover:bg-white hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 group"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 group-hover:text-gray-800 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Refresh</span>
            </button>
          </div>

          {/* Breadcrumb Navigation */}
          <nav className="flex items-center space-x-2 text-sm mb-6">
            <button
              onClick={() => handleBreadcrumbClick('')}
              className="flex items-center space-x-1 px-3 py-2 bg-white/60 backdrop-blur-sm rounded-lg hover:bg-white/80 transition-all duration-200 text-gray-600 hover:text-gray-800 font-medium"
            >
              <HomeIcon className="w-4 h-4" />
              <span>Root</span>
            </button>

            {getBreadcrumbs().map((breadcrumb, index) => (
              <div key={index} className="flex items-center space-x-2">
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <button
                  onClick={() => handleBreadcrumbClick(breadcrumb.path)}
                  className="px-3 py-2 bg-white/60 backdrop-blur-sm rounded-lg hover:bg-white/80 transition-all duration-200 text-gray-600 hover:text-gray-800 font-medium"
                >
                  {breadcrumb.name}
                </button>
              </div>
            ))}
          </nav>
        </div>

        {/* Upload Zone */}
        <div
          className={`relative border-2 border-dashed rounded-3xl mb-10 transition-all duration-300 ease-out overflow-hidden ${
            isDragOver 
              ? 'border-gray-400 bg-gradient-to-br from-gray-50/80 to-gray-100/60 scale-[1.01] shadow-lg' 
              : 'border-gray-300/70 hover:border-gray-400/70 bg-white/40 backdrop-blur-sm hover:bg-white/60'
          } ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
          <div className="relative px-12 py-20 text-center">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-8 transition-all duration-300 ${
              isDragOver ? 'bg-black shadow-lg scale-110' : 'bg-gray-200'
            }`}>
              <Upload className={`w-9 h-9 transition-all duration-300 ${
                isDragOver ? 'text-white' : 'text-gray-600'
              } ${uploading ? 'animate-pulse' : ''}`} />
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {uploading ? 'Uploading files...' : isDragOver ? 'Drop files here' : 'Drag and drop files'}
            </h3>
            <p className="text-gray-600 mb-8 text-lg">
              {uploading ? 'Please wait while files are being uploaded' : 'or click to browse from your computer'}
            </p>

            {!uploading && (
              <>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-8 py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer font-medium"
                >
                  <Plus className="w-5 h-5 mr-3" />
                  Choose Files
                </label>
              </>
            )}
          </div>
        </div>

        {/* Search Bar */}
        {files.length > 0 && (
          <div className="mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search files and folders..."
                className="w-full pl-12 pr-4 py-3.5 bg-white/70 backdrop-blur-sm border border-gray-200/80 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 shadow-sm focus:shadow-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* File List */}
        {loading ? (
          <div className="text-center py-20 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/80 shadow-sm">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black mx-auto mb-6"></div>
            <p className="text-gray-600 text-lg font-medium">Loading your files...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-20 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/80 shadow-sm">
            <div className="w-20 h-20 bg-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <File className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              {currentPath ? 'No files in this folder' : 'No files in your storage'}
            </h3>
            <p className="text-gray-600 text-lg">Upload files using the drag and drop zone above</p>
          </div>
        ) : (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/80 overflow-hidden shadow-lg">
            <div className="px-8 py-6 border-b border-gray-200/80 bg-gradient-to-r from-gray-50/80 to-white/80">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">
                  {filteredFiles.length} item{filteredFiles.length !== 1 ? 's' : ''}
                  {searchTerm && (
                    <span className="text-gray-500 font-normal"> (filtered from {files.length})</span>
                  )}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <HardDrive className="w-4 h-4" />
                    <span>Cloud Storage</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200/60">
              {filteredFiles.map((fileItem) => (
                <div key={fileItem.Key} className="px-8 py-5 hover:bg-gradient-to-r hover:from-gray-50/40 hover:to-gray-100/20 transition-all duration-200 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {fileItem.Type === 'folder' ? (
                          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200">
                            <Folder className="w-6 h-6 text-white" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200">
                            <File className="w-6 h-6 text-gray-600" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {fileItem.Type === 'folder' ? (
                          <button
                            onClick={() => handleFolderClick(fileItem.Key)}
                            className="text-base font-semibold text-black hover:text-gray-700 transition-colors truncate block group-hover:text-gray-800"
                          >
                            {fileItem.Name}
                          </button>
                        ) : (
                          <p className="text-base font-semibold text-gray-900 truncate group-hover:text-gray-800">
                            {fileItem.Name}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span className="font-medium">{formatFileSize(fileItem.Size)}</span>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(fileItem.LastModified)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {fileItem.Type === 'file' && (
                        <button
                          onClick={() => handleDownload(fileItem)}
                          className="p-3 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all duration-200"
                          title="Download"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(fileItem)}
                        className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
