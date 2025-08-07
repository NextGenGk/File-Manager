import { NextRequest, NextResponse } from 'next/server';
import { validateAuthOrApiKey } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    // Test authentication
    const authResult = await validateAuthOrApiKey(request);
    if (!authResult.userId) {
      return NextResponse.json({ 
        error: 'Authentication failed',
        details: 'No user ID found'
      }, { status: 401 });
    }

    // Test form data parsing
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const prefix = formData.get('prefix') as string || '';

    if (!file) {
      return NextResponse.json({ 
        error: 'No file provided',
        received: {
          hasFile: !!file,
          hasPrefix: !!prefix,
          prefix: prefix
        }
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Upload test successful',
      file: {
        name: file.name,
        size: file.size,
        type: file.type,
        prefix: prefix
      },
      auth: {
        type: authResult.authType,
        userId: authResult.userId
      }
    });

  } catch (error) {
    console.error('Upload test error:', error);
    return NextResponse.json({
      error: 'Upload test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Upload test endpoint is working',
    method: 'POST',
    required_fields: ['file', 'prefix (optional)'],
    authentication: 'Clerk session or API key'
  });
}
