'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

export default function DebugPage() {
  const { isSignedIn, isLoaded, user } = useUser()
  const [publishableKey, setPublishableKey] = useState<string>('')
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    // Get client-side environment variables
    const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'NOT_SET'
    setPublishableKey(key)

    // Capture console errors
    const originalError = console.error
    console.error = (...args) => {
      setErrors(prev => [...prev, args.join(' ')])
      originalError(...args)
    }

    return () => {
      console.error = originalError
    }
  }, [])

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Information</h1>
        
        <div className="grid gap-6">
          {/* Environment Variables */}
          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
            <div className="space-y-2 font-mono text-sm">
              <div>
                <span className="text-gray-400">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:</span>
                <div className="mt-1 p-2 bg-gray-800 rounded break-all">
                  {publishableKey || 'NOT_SET'}
                </div>
                <div className="text-sm mt-1">
                  Length: {publishableKey.length} characters
                  {publishableKey.length < 50 && (
                    <span className="text-red-400 ml-2">⚠️ TOO SHORT</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Clerk State */}
          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Clerk State</h2>
            <div className="space-y-2">
              <div>
                <span className="text-gray-400">isLoaded:</span> 
                <span className={isLoaded ? 'text-green-400' : 'text-red-400'}>
                  {isLoaded ? 'true' : 'false'}
                </span>
              </div>
              <div>
                <span className="text-gray-400">isSignedIn:</span> 
                <span className={isSignedIn ? 'text-green-400' : 'text-yellow-400'}>
                  {String(isSignedIn)}
                </span>
              </div>
              <div>
                <span className="text-gray-400">user:</span> 
                <span className={user ? 'text-green-400' : 'text-gray-400'}>
                  {user ? 'Present' : 'null'}
                </span>
              </div>
            </div>
          </div>

          {/* Console Errors */}
          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Console Errors</h2>
            {errors.length === 0 ? (
              <div className="text-gray-400">No errors captured yet</div>
            ) : (
              <div className="space-y-2">
                {errors.map((error, index) => (
                  <div key={index} className="p-2 bg-red-900/20 border border-red-500/20 rounded text-red-300 text-sm font-mono">
                    {error}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Browser Info */}
          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Browser Information</h2>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-400">User Agent:</span> {typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'}</div>
              <div><span className="text-gray-400">URL:</span> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="space-x-4">
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Reload Page
              </button>
              <button 
                onClick={() => setErrors([])} 
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Clear Errors
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
