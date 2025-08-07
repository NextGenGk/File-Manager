import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    console.log('=== SIMPLE DEBUG ENDPOINT ===');
    
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
    
    return NextResponse.json({
      success: true,
      message: 'Debug endpoint working',
      receivedHeaders: Object.fromEntries(request.headers.entries()),
      apiKeyProvided: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : null
    });
    
  } catch (error) {
    console.error('Simple debug error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
