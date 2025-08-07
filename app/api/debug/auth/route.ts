import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from '@/lib/api-key-helpers';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG AUTH ENDPOINT ===');
    
    // Get API key from headers
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
    
    console.log('API Key from headers:', apiKey);
    console.log('All headers:', Object.fromEntries(request.headers.entries()));
    
    if (!apiKey) {
      return NextResponse.json({
        error: 'No API key provided',
        headers: Object.fromEntries(request.headers.entries())
      }, { status: 400 });
    }
    
    // Test API key validation
    const result = await validateApiKey(apiKey);
    console.log('Validation result:', result);
    
    if (result) {
      return NextResponse.json({
        success: true,
        userId: result.userId,
        permissions: result.permissions,
        message: 'API key is valid'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'API key is invalid or inactive'
      }, { status: 401 });
    }
    
  } catch (error) {
    console.error('Debug auth error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
