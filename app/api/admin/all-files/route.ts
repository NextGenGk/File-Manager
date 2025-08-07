import { NextRequest, NextResponse } from "next/server";
import { supabase } from '@/lib/supabase';

export async function GET(_request: NextRequest) {
  try {
    // For security, you might want to add admin authentication here
    // For now, this is a debug endpoint
    
    const { data: files, error } = await supabase
      .from('user_files')
      .select(`
        *,
        users!inner(
          clerk_id,
          email,
          first_name,
          last_name
        )
      `)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching all files:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch files',
        details: error.message
      }, { status: 500 });
    }

    // Transform the data to include user info
    const transformedFiles = (files || []).map(file => ({
      id: file.id,
      file_name: file.file_name,
      file_size: file.file_size,
      content_type: file.content_type,
      uploaded_at: file.uploaded_at,
      last_accessed: file.last_accessed,
      s3_key: file.s3_key,
      user: {
        clerk_id: file.users?.clerk_id,
        email: file.users?.email,
        first_name: file.users?.first_name,
        last_name: file.users?.last_name
      }
    }));

    return NextResponse.json({
      success: true,
      files: transformedFiles,
      count: transformedFiles.length,
      message: 'All files retrieved successfully'
    });

  } catch (error) {
    console.error('Admin endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Alternative method: fetch files by specific user (for debugging)
export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();
    
    let query = supabase.from('user_files').select('*');
    
    if (userId) {
      // Get user's database ID first
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', userId)
        .single();
      
      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        return NextResponse.json({
          success: false,
          error: 'User not found'
        });
      }
    } else if (email) {
      // Get user by email
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();
      
      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        return NextResponse.json({
          success: false,
          error: 'User not found'
        });
      }
    }

    const { data: files, error } = await query
      .order('uploaded_at', { ascending: false });

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      });
    }

    return NextResponse.json({
      success: true,
      files: files || [],
      count: files?.length || 0
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
