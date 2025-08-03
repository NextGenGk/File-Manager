// PRODUCTION: Commented out debugging component for production build
// This component was used for development/troubleshooting authentication and API issues

/*
'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'

export default function AuthDebugger() {
  const { user, isSignedIn, isLoaded } = useUser()
  const [testResult, setTestResult] = useState(null)
  const [apiResult, setApiResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const testAuth = async () => {
    setLoading(true)
    try {
      // Test the auth-test endpoint
      const authResponse = await fetch('/api/auth-test')
      const authData = await authResponse.json()
      setTestResult(authData)
      
      // Try to access the objects API
      const apiResponse = await fetch('/api/objects?prefix=&bucket=general-s3-ui')
      const apiData = await apiResponse.json()
      setApiResult({
        status: apiResponse.status,
        statusText: apiResponse.statusText,
        data: apiData
      })
    } catch (error) {
      console.error('Error testing authentication:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="my-8 p-6 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/80 shadow-lg">
      <h2 className="text-xl font-bold mb-4">Authentication Debugger</h2>
      
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Client-side Auth State:</h3>
        <div className="bg-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto">
          <pre>
            {JSON.stringify(
              {
                isLoaded,
                isSignedIn,
                userId: user?.id,
                userName: user?.firstName,
                userEmail: user?.emailAddresses?.[0]?.emailAddress
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>

      <button
        onClick={testAuth}
        disabled={loading}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Authentication'}
      </button>

      {testResult && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Auth Test Result:</h3>
          <div className="bg-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto">
            <pre>{JSON.stringify(testResult, null, 2)}</pre>
          </div>
        </div>
      )}

      {apiResult && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">API Test Result:</h3>
          <div className="bg-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto">
            <pre>{JSON.stringify(apiResult, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  )
}
*/

// Production-ready placeholder - debugging component disabled for production
export default function AuthDebugger() {
  // Authentication debugging component disabled in production
  return null
}
