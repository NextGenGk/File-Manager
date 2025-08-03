import { auth, currentUser } from '@clerk/nextjs/server';
import { createOrUpdateUser } from '@/lib/supabase-storage';
import { validateApiKey } from '@/lib/api-key-helpers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Helper function to validate authentication and ensure user exists in the database
 * Returns the userId if authenticated, or throws an error response if not
 */
export async function validateAuth() {
  // Get authentication information
  const { userId } = await auth();

  if (!userId) {
    throw new NextResponse(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'You must be logged in to access this resource'
      }),
      { status: 401 }
    );
  }

  // Get user details and ensure they exist in our database
  const user = await currentUser();
  if (!user) {
    throw new NextResponse(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'User not found'
      }),
      { status: 401 }
    );
  }

  // Create or update user in our database
  try {
    await createOrUpdateUser(user);
  } catch (error) {
    console.error('Error creating/updating user in database:', error);
    throw new NextResponse(
      JSON.stringify({
        error: 'Database Error',
        message: 'Failed to update user information'
      }),
      { status: 500 }
    );
  }

  return userId;
}

/**
 * Enhanced authentication that supports both Clerk and API key authentication
 */
export async function validateAuthOrApiKey(request: NextRequest) {
  // First try API key authentication
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');

  if (apiKey) {
    const apiKeyAuth = await validateApiKey(apiKey);
    if (apiKeyAuth) {
      return {
        userId: apiKeyAuth.userId,
        permissions: apiKeyAuth.permissions,
        authType: 'api_key' as const
      };
    }
  }

  // Fall back to Clerk authentication
  const { userId } = await auth();

  if (!userId) {
    throw new NextResponse(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'You must be logged in or provide a valid API key to access this resource'
      }),
      { status: 401 }
    );
  }

  // Get user details and ensure they exist in our database
  const user = await currentUser();
  if (!user) {
    throw new NextResponse(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'User not found'
      }),
      { status: 401 }
    );
  }

  // Create or update user in our database
  try {
    await createOrUpdateUser(user);
  } catch (error) {
    console.error('Error creating/updating user in database:', error);
    throw new NextResponse(
      JSON.stringify({
        error: 'Database Error',
        message: 'Failed to update user information'
      }),
      { status: 500 }
    );
  }

  return {
    userId,
    permissions: ['read', 'write', 'delete'], // Full permissions for authenticated users
    authType: 'clerk' as const
  };
}

/**
 * Check if user has required permission
 */
export function hasPermission(permissions: string[], required: string): boolean {
  return permissions.includes(required) || permissions.includes('admin');
}
