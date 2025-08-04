import {NextRequest, NextResponse} from "next/server";
import {S3Client, ListObjectsV2Command} from "@aws-sdk/client-s3";
import { auth, currentUser } from '@clerk/nextjs/server';
import { getUserStorageInfo, createOrUpdateUser, getUserFiles, getUserByClerkId } from '@/lib/supabase-storage';
import { validateApiKey } from '@/lib/api-key-helpers';

const client = new S3Client({
    region: process.env.AWS_REGION || process.env.S3_REGION as string,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY as string
    }
});

const DEFAULT_BUCKET = process.env.AWS_S3_BUCKET_NAME || process.env.S3_BUCKET_NAME || 'general-s3-ui';

export async function GET(request: NextRequest) {
    try {
        let userId: string;
        let user: any;

        // Check for API key authentication first
        const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');

        if (apiKey) {
            // API key authentication
            const apiKeyAuth = await validateApiKey(apiKey);
            if (!apiKeyAuth) {
                return NextResponse.json({
                    error: 'Invalid API key',
                    message: 'The provided API key is invalid or expired'
                }, { status: 401 });
            }

            userId = apiKeyAuth.userId;

            // Check if API key has read permissions
            if (!apiKeyAuth.permissions.includes('read')) {
                return NextResponse.json({
                    error: 'Insufficient permissions',
                    message: 'API key does not have read permissions'
                }, { status: 403 });
            }

            // Get user info for API key auth
            const dbUser = await getUserByClerkId(userId);
            if (!dbUser) {
                return NextResponse.json({
                    error: 'User not found',
                    message: 'Could not retrieve user details'
                }, { status: 401 });
            }
            user = { id: userId };
        } else {
            // Clerk authentication
            const { userId: clerkUserId } = await auth();

            if (!clerkUserId) {
                return NextResponse.json({
                    error: 'Unauthorized',
                    message: 'Authentication required. Provide either Clerk session or API key.'
                }, { status: 401 });
            }

            userId = clerkUserId;
            user = await currentUser();
            if (!user) {
                return NextResponse.json({
                    error: 'User not found',
                    message: 'Could not retrieve user details'
                }, { status: 401 });
            }

            await createOrUpdateUser(user);
        }

        const files = await getUserFiles(userId);

        return NextResponse.json({
            files: files.map(file => ({
                id: file.id,
                file_name: file.file_name,
                file_size: file.file_size,
                content_type: file.content_type,
                uploaded_at: file.uploaded_at,
                s3_key: file.s3_key.replace(`user-${userId}/`, '')
            }))
        });

    } catch (error) {
        console.error('Objects endpoint error:', error)
        return NextResponse.json({
            error: 'Failed to fetch objects',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}