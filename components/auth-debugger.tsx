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
        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors mb-4"
      >
        {loading ? 'Testing...' : 'Test Authentication'}
      </button>
      
      {testResult && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Auth Test Endpoint Result:</h3>
          <div className="bg-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto">
            <pre>{JSON.stringify(testResult, null, 2)}</pre>
          </div>
        </div>
      )}
      
      {apiResult && (
        <div>
          <h3 className="font-semibold mb-2">API Objects Endpoint Result:</h3>
          <div className={`bg-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto ${
            apiResult.status !== 200 ? 'border-l-4 border-red-500' : ''
          }`}>
            <div className="mb-2">Status: {apiResult.status} {apiResult.statusText}</div>
            <pre>{JSON.stringify(apiResult.data, null, 2)}</pre>
          </div>
        </div>
      )}
      
      <div className="mt-6 text-sm text-gray-600">
        <p>If you're experiencing auth issues:</p>
        <ol className="list-decimal pl-5 mt-2 space-y-1">
          <li>Try signing out completely and signing back in</li>
          <li>Clear browser cookies and cache</li>
          <li>Check that you're using the same browser tab for all operations</li>
          <li>Ensure your Clerk configuration is correct</li>
        </ol>
      </div>
    </div>
  )
}
