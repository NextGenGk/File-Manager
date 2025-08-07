import { NextRequest, NextResponse } from "next/server";
import { validateAuthOrApiKey, hasPermission } from '@/lib/auth-helpers';
import { listFiles } from '@/lib/file-service';

export async function GET(request: NextRequest) {
    try {
        // Debug: Log all headers
        console.log('=== /api/objects Debug Info ===');
        console.log('Headers:', Object.fromEntries(request.headers.entries()));
        
        // Support both API key and Clerk session authentication
        const auth = await validateAuthOrApiKey(request);
        
        console.log('Auth result:', auth);
        
        if (!hasPermission(auth.permissions, 'read')) {
            console.log('Missing read permission:', auth.permissions);
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Read permission required' },
                { status: 403 }
            );
        }

        console.log(`Fetching files for user: ${auth.userId}`);
        
        // Fetch authenticated user's files using the new file service
        const files = await listFiles(auth.userId);
        
        console.log(`Found ${files?.length || 0} files for user ${auth.userId}`);
        
        return NextResponse.json({
            success: true,
            files: files || [],
            count: files?.length || 0
        });
        
    } catch (error) {
        console.error('=== /api/objects ERROR ===');
        console.error('Error in GET /api/objects:', error);
        console.error('Request headers:', Object.fromEntries(request.headers.entries()));
        
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch files',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        }, { status: 500 });
    }
}
