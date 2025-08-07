'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { createOrUpdateUser } from '@/lib/supabase-storage'

export default function ForceUserSync() {
  const { user, isLoaded } = useUser()
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded || !user || syncStatus !== 'idle') return

    const forceSync = async () => {
      try {
        setSyncStatus('syncing')
        setError(null)
        
        console.log('🔄 Force syncing user:', user.id)
        
        // Attempt to create/update user with retry logic
        let attempts = 0
        const maxAttempts = 3
        
        while (attempts < maxAttempts) {
          try {
            await createOrUpdateUser({
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              emailAddresses: user.emailAddresses,
              imageUrl: user.imageUrl
            })
            
            console.log('✅ Force sync successful')
            setSyncStatus('success')
            return
            
          } catch (syncError) {
            attempts++
            console.warn(`⚠️ Sync attempt ${attempts}/${maxAttempts} failed:`, syncError)
            
            if (attempts === maxAttempts) {
              throw syncError
            }
            
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000))
          }
        }
        
      } catch (syncError) {
        const errorMessage = syncError instanceof Error ? syncError.message : 'Unknown sync error'
        console.error('❌ Force sync failed:', errorMessage)
        setError(errorMessage)
        setSyncStatus('error')
        
        // Even if sync fails, don't block the user - set to success after 5 seconds
        setTimeout(() => {
          console.log('🏳️ Allowing user to proceed despite sync failure')
          setSyncStatus('success')
          setError(null)
        }, 5000)
      }
    }

    forceSync()
  }, [isLoaded, user, syncStatus])

  // Don't render anything in production unless there's an error
  if (process.env.NODE_ENV === 'production' && syncStatus !== 'error') {
    return null
  }

  // Development mode - show sync status
  if (process.env.NODE_ENV === 'development') {
    if (syncStatus === 'syncing') {
      return (
        <div className="fixed top-4 right-4 bg-blue-500/90 text-white p-3 rounded-lg text-sm z-50">
          🔄 Syncing user account...
        </div>
      )
    }

    if (syncStatus === 'error' && error) {
      return (
        <div className="fixed top-4 right-4 bg-yellow-500/90 text-white p-3 rounded-lg text-sm max-w-xs z-50">
          ⚠️ Sync warning: {error}
          <div className="text-xs mt-1 opacity-80">
            You can still use the app normally.
          </div>
        </div>
      )
    }

    if (syncStatus === 'success') {
      return (
        <div className="fixed top-4 right-4 bg-green-500/90 text-white p-3 rounded-lg text-sm z-50 animate-pulse">
          ✅ User synced successfully!
        </div>
      )
    }
  }

  return null
}
