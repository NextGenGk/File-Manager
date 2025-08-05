import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // Check environment variables (without exposing secrets)
        const config = {
            hasAWSRegion: !!process.env.AWS_REGION,
            hasS3Region: !!process.env.S3_REGION,
            hasAWSAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
            hasS3AccessKey: !!process.env.S3_ACCESS_KEY_ID,
            hasAWSSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
            hasS3SecretKey: !!process.env.S3_SECRET_ACCESS_KEY,
            hasAWSBucket: !!process.env.AWS_S3_BUCKET_NAME,
            hasS3Bucket: !!process.env.S3_BUCKET_NAME,
            
            // Show actual values for debugging (safe to show these)
            regionValue: process.env.AWS_REGION || process.env.S3_REGION || 'NOT_SET',
            bucketValue: process.env.AWS_S3_BUCKET_NAME || process.env.S3_BUCKET_NAME || 'NOT_SET',
        };

        return NextResponse.json({
            message: 'Environment Configuration Check',
            config,
            recommendation: !config.hasAWSBucket && !config.hasS3Bucket 
                ? 'MISSING: You need to set AWS_S3_BUCKET_NAME or S3_BUCKET_NAME in your .env.local file'
                : 'Bucket configuration looks good'
        });

    } catch (error) {
        return NextResponse.json({
            error: 'Failed to check environment',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
