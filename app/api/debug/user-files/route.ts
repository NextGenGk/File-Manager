import { NextRequest, NextResponse } from "next/server";
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clerkId = searchParams.get('clerkId');
    
    if (!clerkId) {
      return NextResponse.json({
        success: false,
        error: 'clerkId parameter is required'
      });
    }

    console.log(`Debug: Fetching files for clerkId: ${clerkId}`);

    // Get user by clerk_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, clerk_id, email, bucket_prefix')
      .eq('clerk_id', clerkId)
      .single();

    if (userError || !user) {
      console.error('User not found:', userError);
      return NextResponse.json({
        success: false,
        error: 'User not found',
        clerkId
      });
    }

    console.log(`Debug: Found user ${user.id} for ${clerkId}`);

    // Get files for this user
    const { data: files, error: filesError } = await supabase
      .from('user_files')
      .select('*')
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false });

    if (filesError) {
      console.error('Error fetching files:', filesError);
      return NextResponse.json({
        success: false,
        error: filesError.message
      });
    }

    console.log(`Debug: Found ${files?.length || 0} files for user ${user.id}`);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        clerk_id: user.clerk_id,
        email: user.email,
        bucket_prefix: user.bucket_prefix
      },
      files: files || [],
      count: files?.length || 0,
      message: 'Files retrieved successfully'
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
