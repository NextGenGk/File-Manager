import {NextRequest, NextResponse} from "next/server";
import {S3Client, ListObjectsV2Command} from "@aws-sdk/client-s3";

const client = new S3Client({
    region : process.env.AWS_REGION as string,
    credentials : {
        accessKeyId : process.env.AWS_ACCESS_KEY as string,
        secretAccessKey : process.env.AWS_SECRET_KEY as string
    }
})

export async function GET(request : NextRequest) {
    const prefix = request.nextUrl.searchParams.get('prefix') ?? '';
    const bucketName = request.nextUrl.searchParams.get('bucket') ?? 'general-s3-ui';

    const command = new ListObjectsV2Command({
        Bucket : bucketName,
        Prefix : prefix,
        Delimiter : '/',
    });

    const result = await client.send(command);

    // Get folders (CommonPrefixes)
    const folders = result.CommonPrefixes?.map(prefix => ({
        Key: prefix.Prefix,
        Type: 'folder',
        Size: null,
        LastModified: null,
        Name: prefix.Prefix?.replace(prefix.Prefix.slice(0, -1).lastIndexOf('/') + 1, '').slice(0, -1) || prefix.Prefix?.slice(0, -1)
    })) || [];

    // Get files (Contents) - exclude folders and the prefix itself
    const files = result.Contents?.filter(item =>
        item.Key !== prefix && !item.Key?.endsWith('/')
    ).map(item => ({
        Key: item.Key,
        Type: 'file',
        Size: item.Size,
        LastModified: item.LastModified,
        Name: item.Key?.split('/').pop() || item.Key
    })) || [];

    // Combine folders and files
    const items = [...folders, ...files];

    return NextResponse.json({
        status: 'success',
        items: items,
        prefix: prefix
    });
}