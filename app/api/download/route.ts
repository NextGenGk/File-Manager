import { auth } from '@clerk/nextjs/server';
import { getUserStorageInfo } from '@/lib/supabase-storage';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextRequest, NextResponse } from 'next/server';

const client = new S3Client({
    region: process.env.S3_REGION as string,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string
    }
});

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
        const bucketName = searchParams.get('bucket') || 'general-s3-ui';
        const method = searchParams.get('method') || 'presigned';

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

            return NextResponse.json({ 
                success: true, 
                downloadUrl: signedUrl,
                fileName: key.split('/').pop() || key
            });
        } else {
            // Direct download through our API (for smaller files)
            const command = new GetObjectCommand({
                Bucket: bucketName,
                Key: userKey,
            });

            const result = await client.send(command);
            
            if (!result.Body) {
                return NextResponse.json({ error: 'File not found' }, { status: 404 });
            }

            // Convert stream to buffer
            const chunks = [];
            const reader = result.Body.transformToWebStream().getReader();
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
            }

            const buffer = Buffer.concat(chunks);
            const fileName = key.split('/').pop() || key;

            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': result.ContentType || 'application/octet-stream',
                    'Content-Disposition': `attachment; filename="${fileName}"`,
                    'Content-Length': result.ContentLength?.toString() || buffer.length.toString(),
                },
            });
        }

    } catch (error) {
        console.error('Download error:', error);
        return NextResponse.json({
            error: 'Download failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
