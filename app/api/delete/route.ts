import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { deleteUserFile, getUserByClerkId, getUserStorageInfo } from '@/lib/supabase-storage';

const client = new S3Client({
    region: process.env.S3_REGION as string,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string
    }
});

export async function DELETE(request: NextRequest) {
    try {
        // Get authenticated user
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's storage info
        const storageInfo = await getUserStorageInfo(userId);

        if (!storageInfo) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const key = searchParams.get('key');
        const type = searchParams.get('type');
        const bucketName = searchParams.get('bucket') || 'general-s3-ui';

        if (!key) {
            return NextResponse.json({ error: 'No key provided' }, { status: 400 });
        }

        // Add user prefix to the key
        const userKey = `${storageInfo.prefix}/${key}`;

        if (type === 'folder') {
            // For folders, we need to delete all objects with this prefix
            const listCommand = new ListObjectsV2Command({
                Bucket: bucketName,
                Prefix: userKey,
            });

            const listResult = await client.send(listCommand);

            if (listResult.Contents && listResult.Contents.length > 0) {
                // Delete all objects in the folder from S3
                const deleteCommand = new DeleteObjectsCommand({
                    Bucket: bucketName,
                    Delete: {
                        Objects: listResult.Contents.map(obj => ({ Key: obj.Key! })),
                        Quiet: false
                    }
                });

                await client.send(deleteCommand);

                // Delete from database using clerkId
                for (const obj of listResult.Contents) {
                    if (obj.Key) {
                        await deleteUserFile(userId, obj.Key);
                    }
                }
            }
        } else {
            // For single files
            const deleteCommand = new DeleteObjectCommand({
                Bucket: bucketName,
                Key: userKey,
            });

            await client.send(deleteCommand);

            // Delete from database using clerkId
            await deleteUserFile(userId, userKey);
        }

        return NextResponse.json({
            success: true,
            message: `${type === 'folder' ? 'Folder' : 'File'} deleted successfully`
        });

    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json({
            error: 'Delete failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
