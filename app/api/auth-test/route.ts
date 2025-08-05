// PRODUCTION: Commented out debugging API endpoint for production build
// This endpoint was used for development/troubleshooting authentication issues

/*
import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    console.log('Auth test endpoint called')
    
    const { userId, sessionId } = auth()
    const user = await currentUser()
    
    console.log('Auth test - userId:', userId)
    console.log('Auth test - sessionId:', sessionId)
    console.log('Auth test - user:', user?.firstName, user?.emailAddresses?.[0]?.emailAddress)
    
    return NextResponse.json({
      success: true,
      userId: userId,
      sessionId: sessionId,
      userEmail: user?.emailAddresses?.[0]?.emailAddress,
      userName: user?.firstName,
      isAuthenticated: !!userId && !!user,
      hasSession: !!sessionId,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Auth test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
*/

// Production: Auth test endpoint disabled for production
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'Auth test endpoint disabled in production'
  }, { status: 404 })
}
