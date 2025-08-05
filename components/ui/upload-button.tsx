import React, { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface UploadButtonProps {
onUploadComplete?: (file: unknown) => void
  currentPath?: string
  disabled?: boolean
}

export function UploadButton({ 
  onUploadComplete, 
  currentPath = '',
  disabled = false
}: UploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return
    }

    const file = e.target.files[0]
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('path', currentPath)
      formData.append('isFolder', 'false')

      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        if (response.status === 413) {
          toast('Storage Quota Exceeded: You have reached your storage limit. Delete some files or upgrade your plan.')
        } else {
          throw new Error(data.error || 'Failed to upload file')
        }
        return
      }

      const data = await response.json()

      toast(`File Uploaded: ${file.name} has been uploaded successfully.`)

      if (onUploadComplete) {
        onUploadComplete(data.file)
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast(`Upload Failed: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`)
    } finally {
      setIsUploading(false)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div>
      <input
        type="file"
        id="file-upload"
        className="sr-only"
        ref={fileInputRef}
        onChange={handleUpload}
        disabled={isUploading || disabled}
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading || disabled}
        className="px-3 py-2 bg-blue-500 text-white rounded flex items-center"
      >
        <Upload className="mr-2 h-4 w-4" />
        {isUploading ? 'Uploading...' : 'Upload'}
      </Button>
    </div>
  )
}
