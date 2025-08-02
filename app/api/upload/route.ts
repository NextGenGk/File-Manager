import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getUserStorageInfo, updateUserStorageUsed, createUserFile, createOrUpdateUser } from '@/lib/supabase-storage';

const client = new S3Client({
    region: process.env.AWS_REGION as string,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY as string,
        secretAccessKey: process.env.AWS_SECRET_KEY as string
    }
});

export async function POST(request: NextRequest) {
    try {
        console.log('Upload API called');

        // Enhanced authentication check
        const { userId } = await auth();
        console.log('Upload API - userId:', userId);

        if (!userId) {
            console.log('Upload API - No userId found, returning 401');
            return NextResponse.json({
                error: 'Unauthorized',
                message: 'Authentication required'
            }, { status: 401 });
        }

        // Get user details
        const user = await currentUser();
        if (!user) {
            console.log('Upload API - No user details found');
            return NextResponse.json({
                error: 'User not found',
                message: 'Could not retrieve user details'
            }, { status: 401 });
        }

        console.log('Upload API - User authenticated:', user.firstName, user.emailAddresses[0]?.emailAddress);

        // Create or update user in our Supabase database
        await createOrUpdateUser(user);

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const prefix = formData.get('prefix') as string || '';
        const bucketName = formData.get('bucket') as string || 'general-s3-ui';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Get user's storage info from Supabase
        const storageInfo = await getUserStorageInfo(userId);

        if (!storageInfo) {
            return NextResponse.json({ error: 'User storage not configured' }, { status: 404 });
        }

        // Check storage quota
        if (storageInfo.available < file.size) {
            return NextResponse.json({
                error: 'Storage quota exceeded',
                details: `File size (${file.size} bytes) exceeds available storage (${storageInfo.available} bytes)`
            }, { status: 400 });
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create the S3 key with user prefix
        const userPath = prefix ? `${storageInfo.prefix}/${prefix}${file.name}` : `${storageInfo.prefix}/${file.name}`;

        // Upload to S3
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: userPath,
            Body: buffer,
            ContentType: file.type,
        });

        await client.send(command);

        // Save file info to database
        await createUserFile({
            clerkId: userId,
            s3Key: userPath,
            fileName: file.name,
            fileSize: file.size,
            contentType: file.type,
        });

        // Update user's storage used
        await updateUserStorageUsed(userId, file.size);

        console.log('Upload successful:', file.name);

        return NextResponse.json({
            success: true,
            message: 'File uploaded successfully',
            key: prefix ? `${prefix}${file.name}` : file.name,
            size: file.size
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({
            error: 'Upload failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
