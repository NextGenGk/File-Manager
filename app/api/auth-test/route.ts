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

// Enhanced auth test endpoint for debugging
import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getUserByClerkId, createOrUpdateUser } from '@/lib/supabase-storage'

export async function GET() {
  try {
    console.log('🔍 Auth test starting...')
    
    // Get current user from Clerk
    const user = await currentUser()
    
    if (!user) {
      console.log('❌ No user found in Clerk')
      return NextResponse.json({ 
        error: 'Not authenticated', 
        authenticated: false,
        clerkUser: null,
        suggestion: 'User needs to sign in through Clerk'
      }, { status: 401 })
    }

    console.log('✅ User found in Clerk:', {
      id: user.id,
      email: user.emailAddresses?.[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      hasEmailAddresses: !!user.emailAddresses?.length
    })

    // Check if user exists in our database
    let dbUser = await getUserByClerkId(user.id)
    
    if (!dbUser) {
      console.log('❌ User not found in database, attempting to create...')
      try {
        // Force create user with all required data
        const newUser = await createOrUpdateUser({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          emailAddresses: user.emailAddresses || [],
          imageUrl: user.imageUrl || ''
        })
        
        console.log('✅ User created in database:', newUser.id)
        
        return NextResponse.json({ 
          authenticated: true,
          clerkUser: {
            id: user.id,
            email: user.emailAddresses?.[0]?.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName
          },
          dbUser: {
            id: newUser.id,
            email: newUser.email,
            createdAt: newUser.created_at
          },
          action: 'created',
          message: 'User was missing from database and has been created successfully'
        })
      } catch (createError) {
        console.error('❌ Failed to create user in database:', createError)
        return NextResponse.json({ 
          error: 'Failed to sync user with database',
          authenticated: true,
          clerkUser: {
            id: user.id,
            email: user.emailAddresses?.[0]?.emailAddress
          },
          dbUser: null,
          createError: createError instanceof Error ? createError.message : 'Unknown error',
          suggestion: 'Check database connection and Supabase configuration'
        }, { status: 500 })
      }
    }

    console.log('✅ User found in database:', dbUser.id)
    return NextResponse.json({ 
      authenticated: true,
      clerkUser: {
        id: user.id,
        email: user.emailAddresses?.[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName
      },
      dbUser: {
        id: dbUser.id,
        email: dbUser.email,
        createdAt: dbUser.created_at
      },
      action: 'found',
      message: 'User authentication and database sync successful'
    })
    
  } catch (error) {
    console.error('❌ Auth test error:', error)
    return NextResponse.json({ 
      error: 'Authentication test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Check Clerk configuration and API keys'
    }, { status: 500 })
  }
}
