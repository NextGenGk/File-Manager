import {NextRequest, NextResponse} from "next/server";
import {S3Client, ListObjectsV2Command} from "@aws-sdk/client-s3";
import { auth, currentUser } from '@clerk/nextjs/server';
import { getUserStorageInfo, createOrUpdateUser, getUserFiles } from '@/lib/supabase-storage';

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
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({
                error: 'Unauthorized',
                message: 'Authentication required'
            }, { status: 401 });
        }

        const user = await currentUser();
        if (!user) {
            return NextResponse.json({
                error: 'User not found',
                message: 'Could not retrieve user details'
            }, { status: 401 });
        }

        await createOrUpdateUser(user);

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
        return NextResponse.json({
            error: 'Failed to fetch objects',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}