'use client'

import { useUser } from '@clerk/nextjs'
import GridBackgroundDemo from '@/components/ui/grid-background-demo'

export default function HomePage() {
  const { user, isSignedIn, isLoaded } = useUser()

  return (
    <div className="min-h-screen">
      <GridBackgroundDemo />
    </div>
  )
}
