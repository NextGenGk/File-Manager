import {NextRequest, NextResponse} from "next/server";
import {S3Client, ListObjectsV2Command} from "@aws-sdk/client-s3";
import { auth, currentUser } from '@clerk/nextjs/server';
import { getUserStorageInfo, createOrUpdateUser } from '@/lib/supabase-storage';

const client = new S3Client({
    region: process.env.S3_REGION as string,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string
    }
})

export async function GET(request : NextRequest) {
    try {
        console.log('API /objects called');

        // Enhanced authentication check
        const { userId } = await auth();
        console.log('Objects API - userId:', userId);

        if (!userId) {
            console.log('Objects API - No userId found, returning 401');
            return NextResponse.json({
                error: 'Unauthorized',
                message: 'Authentication required'
            }, { status: 401 });
        }

        // Get user details
        const user = await currentUser();
        if (!user) {
            console.log('Objects API - No user details found');
            return NextResponse.json({
                error: 'User not found',
                message: 'Could not retrieve user details'
            }, { status: 401 });
        }

        console.log('Objects API - User authenticated:', user.firstName, user.emailAddresses[0]?.emailAddress);

        // Create or update user in our Supabase database
        await createOrUpdateUser(user);

        // Get user's storage info from Supabase
        const storageInfo = await getUserStorageInfo(userId);

        if (!storageInfo) {
            console.log('Objects API - No storage info found for user:', userId);
            return NextResponse.json({
                error: 'User not found',
                message: 'User record not found in database'
            }, { status: 404 });
        }

        console.log('Storage info found:', storageInfo);

        const prefix = request.nextUrl.searchParams.get('prefix') ?? '';
        const bucketName = request.nextUrl.searchParams.get('bucket') ?? 'general-s3-ui';

        // Prepend user's prefix to ensure they only see their files
        const userPrefix = storageInfo.prefix + '/' + prefix;

        const command = new ListObjectsV2Command({
            Bucket : bucketName,
            Prefix : userPrefix,
            Delimiter : '/',
        });

        const result = await client.send(command);

        // Get folders (CommonPrefixes)
        const folders = result.CommonPrefixes?.map(prefixObj => {
            const fullPrefix = prefixObj.Prefix || '';
            // Remove user prefix from display
            const displayPrefix = fullPrefix.replace(storageInfo.prefix + '/', '');
            const folderName = displayPrefix.split('/').filter(Boolean).pop() || '';

            return {
                Key: displayPrefix,
                Type: 'folder',
                Size: null,
                LastModified: null,
                Name: folderName
            };
        }) || [];

        // Get files (Contents) - exclude folders and the prefix itself
        const files = result.Contents?.filter(item =>
            item.Key !== userPrefix && !item.Key?.endsWith('/')
        ).map(item => {
            const fullKey = item.Key || '';
            // Remove user prefix from display
            const displayKey = fullKey.replace(storageInfo.prefix + '/', '');
            const fileName = displayKey.split('/').pop() || displayKey;

            return {
                Key: displayKey,
                Type: 'file',
                Size: item.Size,
                LastModified: item.LastModified,
                Name: fileName
            };
        }) || [];

        // Combine folders and files
        const items = [...folders, ...files];

        return NextResponse.json({
            status: 'success',
            items: items,
            prefix: prefix,
            storageInfo: {
                used: storageInfo.used,
                quota: storageInfo.quota,
                available: storageInfo.available
            }
        });

    } catch (error) {
        console.error('API /objects error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
            debug: 'Check server logs for details'
        }, { status: 500 });
    }
}