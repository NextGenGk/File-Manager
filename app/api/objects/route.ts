import { NextResponse } from "next/server";
import { getUserFiles } from '@/lib/supabase-storage';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
    try {
        // Get authenticated user ID from Clerk
        const { userId } = await auth();
        
        if (!userId) {
            console.warn('Unauthorized access attempt to /api/objects');
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Authentication required' },
                { status: 401 }
            );
        }

        console.log(`Fetching files for user: ${userId}`);
        
        // Fetch authenticated user's files from Supabase
        const files = await getUserFiles(userId);
        
        console.log(`Found ${files?.length || 0} files for user ${userId}`);
        
        return NextResponse.json({
            success: true,
            files: files || [],
            count: files?.length || 0
        });
        
    } catch (error) {
        console.error('Error in GET /api/objects:', error);
        
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch files',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        }, { status: 500 });
    }
}
