import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getUserStorageInfo, updateUserStorageUsed, createUserFile, createOrUpdateUser } from '@/lib/supabase-storage';

const client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
});

const DEFAULT_BUCKET = process.env.AWS_S3_BUCKET_NAME!;

export async function POST(request: NextRequest) {
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

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const prefix = formData.get('prefix') as string || '';
        const bucketName = DEFAULT_BUCKET;

        if (!bucketName) {
            return NextResponse.json({
                error: 'Server configuration error',
                details: 'S3 bucket not configured properly'
            }, { status: 500 });
        }

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const storageInfo = await getUserStorageInfo(userId);

        if (!storageInfo) {
            return NextResponse.json({ error: 'User storage not configured' }, { status: 404 });
        }

        if (storageInfo.available < file.size) {
            return NextResponse.json({
                error: 'Storage quota exceeded',
                details: `File size (${file.size} bytes) exceeds available storage (${storageInfo.available} bytes)`
            }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const userPath = prefix ? `${storageInfo.prefix}/${prefix}${file.name}` : `${storageInfo.prefix}/${file.name}`;

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: userPath,
            Body: buffer,
            ContentType: file.type,
        });

        await client.send(command);

        await createUserFile(
            userId,
            userPath,
            file.name,
            file.size,
            file.type
        );

        await updateUserStorageUsed(userId, file.size);

        return NextResponse.json({
            success: true,
            message: 'File uploaded successfully',
            key: prefix ? `${prefix}${file.name}` : file.name,
            size: file.size
        });

    } catch (error) {
        return NextResponse.json({
            error: 'Upload failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
