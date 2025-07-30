import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const client = new S3Client({
    region: process.env.AWS_REGION as string,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY as string,
        secretAccessKey: process.env.AWS_SECRET_KEY as string
    }
});

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const key = searchParams.get('key');
        const bucketName = searchParams.get('bucket') || 'general-s3-ui';
        const method = searchParams.get('method') || 'presigned'; // 'presigned' or 'direct'

        if (!key) {
            return NextResponse.json({ error: 'No key provided' }, { status: 400 });
        }

        if (method === 'presigned') {
            // Generate a presigned URL for download
            const command = new GetObjectCommand({
                Bucket: bucketName,
                Key: key,
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
                Key: key,
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
