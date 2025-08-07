import { NextRequest, NextResponse } from "next/server";
import { supabase } from '@/lib/supabase';

export async function GET(_request: NextRequest) {
  try {
    console.log('=== Debug File Listing ===');
    
    // Test database connection
    const { data: _testConnection, error: _connectionError } = await supabase
      .from('user_files')
      .select('*')
      .limit(1);
    
    if (_connectionError) {
      console.error('Database connection error:', _connectionError);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: _connectionError.message
      });
    }

    // Test user lookup
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, clerk_id, bucket_prefix')
      .limit(1);

    if (userError) {
      console.error('User lookup error:', userError);
      return NextResponse.json({
        success: false,
        error: 'User lookup failed',
        details: userError.message
      });
    }

    console.log('Database connection successful');
    console.log('Available users:', users);
    console.log('Available files:', _testConnection);

    console.log('Database connection test:', _testConnection ? 'Success' : 'No data found');

    if (_testConnection && _testConnection.length > 0) {
      console.log('Sample file:', _testConnection[0]);
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection working',
      users: users || [],
      files: _testConnection || [],
      userCount: users?.length || 0,
      fileCount: _testConnection?.length || 0
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
