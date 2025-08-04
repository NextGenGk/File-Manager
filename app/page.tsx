'use client'

import { useUser } from '@clerk/nextjs'
import GridBackgroundDemo from '@/components/ui/grid-background-demo'
import FileUpload from '@/components/file-upload'
import FileManager from '@/components/file-manager'
import Breadcrumb from '@/components/ui/breadcrumb'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export default function HomePage() {
  const { isSignedIn, user, isLoaded } = useUser()
  const [refreshFiles, setRefreshFiles] = useState(0)
  const [currentPath, setCurrentPath] = useState(['Home'])

  const breadcrumbItems = currentPath.map((path, index) => ({
    label: path,
    icon: index === 0 ? '🏠' : '📁',
    isActive: index === currentPath.length - 1
  }))

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/30 border-t-white"></div>
      </div>
    )
  }

  if (isSignedIn && user) {
    return (
      <div className="relative min-h-screen bg-black">
        <div
          className={cn(
            "absolute inset-0",
            "[background-size:40px_40px]",
            "[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]"
          )}
        />
        <div className="pointer-events-none absolute inset-0 bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>

        <div className="relative z-20 px-6 pt-32 pb-12">
          <div className="w-full max-w-3xl mx-auto space-y-6">
            {/* Breadcrumb Navigation */}
            <div className="mb-4">
              <Breadcrumb items={breadcrumbItems} />
            </div>

            {/* Header Section */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">
                Secure Cloud Storage
              </h1>
              <p className="text-lg text-white/70 max-w-2xl mx-auto mb-4">
                Upload, organize, and manage your files with enterprise-grade security.
                Access your documents from anywhere, anytime.
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-white/50">
                <span className="flex items-center gap-1">
                  🔒 End-to-end encryption
                </span>
                <span className="flex items-center gap-1">
                  ☁️ Unlimited storage
                </span>
                <span className="flex items-center gap-1">
                  ⚡ Lightning fast uploads
                </span>
              </div>
            </div>

            {/* Upload Section */}
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-white">Upload Files</h2>
              <p className="text-white/60 text-sm mb-3">
                Drag and drop files or click to browse. Supports all file types up to 100MB.
              </p>
              <FileUpload onUploadSuccess={() => setRefreshFiles(prev => prev + 1)} />
            </div>

            {/* File Manager Section */}
            <div className="space-y-2">
              <div key={refreshFiles}>
                <FileManager />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <GridBackgroundDemo />
    </div>
  )
}
