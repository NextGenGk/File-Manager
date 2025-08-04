import { auth } from '@clerk/nextjs/server';
import { getUserStorageInfo } from '@/lib/supabase-storage';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextRequest, NextResponse } from 'next/server';

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
        const bucketName = DEFAULT_BUCKET;
        const method = searchParams.get('method') || 'presigned';

        if (!bucketName) {
            return NextResponse.json({
                error: 'Server configuration error',
                details: 'S3 bucket not configured properly'
            }, { status: 500 });
        }

        if (!key) {
            return NextResponse.json({ error: 'No key provided' }, { status: 400 });
        }

        // Add user prefix to ensure they can only download their files
        const userKey = `${storageInfo.prefix}/${key}`;

        if (method === 'presigned') {
            // Generate a presigned URL for download
            const command = new GetObjectCommand({
                Bucket: bucketName,
                Key: userKey,
            });

            const signedUrl = await getSignedUrl(client, command, { 
                expiresIn: 3600 // URL expires in 1 hour
            });

            return NextResponse.json({ url: signedUrl });
        } else {
            // Direct download
            const command = new GetObjectCommand({
                Bucket: bucketName,
                Key: userKey,
            });

            const response = await client.send(command);

            if (!response.Body) {
                return NextResponse.json({ error: 'File not found' }, { status: 404 });
            }

            // Convert stream to buffer
            const chunks: Uint8Array[] = [];
            // @ts-expect-error - S3 response Body is a ReadableStream which needs async iteration
            for await (const chunk of response.Body) {
                chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);

            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': response.ContentType || 'application/octet-stream',
                    'Content-Length': response.ContentLength?.toString() || '',
                    'Content-Disposition': `attachment; filename="${key}"`,
                },
            });
        }
    } catch (error) {
        return NextResponse.json({
            error: 'Download failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
