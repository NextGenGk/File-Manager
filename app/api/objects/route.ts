import {NextRequest, NextResponse} from "next/server";
import {S3Client, ListObjectsV2Command} from "@aws-sdk/client-s3";
import { getAllFiles } from '@/lib/supabase-storage';

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
        // Public: fetch all files
        const files = await getAllFiles();
        return NextResponse.json({ files });
    } catch (error) {
        return NextResponse.json({
            error: 'Failed to fetch files',
            details: error instanceof Error ? error.message : error
        }, { status: 500 });
    }
}
