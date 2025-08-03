import { auth, currentUser } from '@clerk/nextjs/server';
import { createOrUpdateUser } from '@/lib/supabase-storage';
import { NextResponse } from 'next/server';

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
