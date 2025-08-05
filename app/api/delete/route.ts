import { currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { deleteUserFile, getUserStorageInfo } from '@/lib/supabase-storage';

const client = new S3Client({
    region: process.env.AWS_REGION || process.env.S3_REGION as string,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY as string
    }
});

const DEFAULT_BUCKET = process.env.AWS_S3_BUCKET_NAME || process.env.S3_BUCKET_NAME || 'general-s3-ui';

export async function DELETE(request: NextRequest) {
    try {
        // Get authenticated user
const user = await currentUser()
        const userId = user?.id;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's storage info
        const storageInfo = await getUserStorageInfo(userId);

        if (!storageInfo) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { key } = await request.json();
        const bucketName = DEFAULT_BUCKET;

        if (!bucketName) {
            return NextResponse.json({
                error: 'Server configuration error',
                details: 'S3 bucket not configured properly'
            }, { status: 500 });
        }

        if (!key) {
            return NextResponse.json({ error: 'No key provided' }, { status: 400 });
        }

        // Create the full S3 key with user prefix
        const userKey = `${storageInfo.prefix}/${key}`;

        // Delete from S3
        const deleteCommand = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: userKey,
        });

        await client.send(deleteCommand);

        // Delete from database
        await deleteUserFile(userId, userKey);

        return NextResponse.json({
            success: true,
            message: 'File deleted successfully',
            key: key
        });

    } catch (error) {
        return NextResponse.json({
            error: 'Delete failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
