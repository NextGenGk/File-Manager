// PRODUCTION: Commented out debugging component for production build
// This component was used for development/troubleshooting authentication issues

/*
'use client'

import { useUser } from '@clerk/nextjs'

export default function AuthDebugger() {
  const { user, isLoaded, isSignedIn } = useUser()

  if (!isLoaded) {
    return <div className="p-4 bg-yellow-100 rounded">Loading auth state...</div>
  }

  return (
    <div className="p-4 bg-gray-100 rounded mb-4">
      <h3 className="font-bold mb-2">Auth Debug Info:</h3>
      <div className="text-sm">
        <p><strong>Is Signed In:</strong> {isSignedIn ? 'Yes' : 'No'}</p>
        <p><strong>User ID:</strong> {user?.id || 'None'}</p>
        <p><strong>Email:</strong> {user?.emailAddresses[0]?.emailAddress || 'None'}</p>
        <p><strong>First Name:</strong> {user?.firstName || 'None'}</p>
        <p><strong>Last Name:</strong> {user?.lastName || 'None'}</p>
      </div>
    </div>
  )
}
*/

// Production-ready placeholder - component disabled for production
export default function AuthDebugger() {
  // Debugging component disabled in production
  return null
}
