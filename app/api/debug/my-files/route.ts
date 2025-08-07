import { NextResponse } from "next/server";
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

export async function GET(_request: Request) {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
        clerkId: null
      });
    }

    // Get the current user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not found in database',
        clerkId,
        userError: userError?.message
      });
    }

    // Get files for the current user
    const { data: files, error: filesError } = await supabase
      .from('user_files')
      .select('*')
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false });

    return NextResponse.json({
      success: true,
      clerkId,
      userId: user.id,
      user,
      files: files || [],
      fileCount: files?.length || 0,
      filesError: filesError?.message
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
