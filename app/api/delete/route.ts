import { NextRequest, NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";

const client = new S3Client({
    region: process.env.AWS_REGION as string,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY as string,
        secretAccessKey: process.env.AWS_SECRET_KEY as string
    }
});

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const key = searchParams.get('key');
        const type = searchParams.get('type');
        const bucketName = searchParams.get('bucket') || 'general-s3-ui';

        if (!key) {
            return NextResponse.json({ error: 'No key provided' }, { status: 400 });
        }

        if (type === 'folder') {
            // For folders, we need to delete all objects with this prefix
            const listCommand = new ListObjectsV2Command({
                Bucket: bucketName,
                Prefix: key,
            });

            const listResult = await client.send(listCommand);

            if (listResult.Contents && listResult.Contents.length > 0) {
                // Delete all objects in the folder
                const deleteCommand = new DeleteObjectsCommand({
                    Bucket: bucketName,
                    Delete: {
                        Objects: listResult.Contents.map(obj => ({ Key: obj.Key! })),
                        Quiet: false
                    }
                });

                await client.send(deleteCommand);
            }
        } else {
            // For single files
            const deleteCommand = new DeleteObjectCommand({
                Bucket: bucketName,
                Key: key,
            });

            await client.send(deleteCommand);
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
