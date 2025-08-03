import { NextRequest, NextResponse } from 'next/server'
import { validateAuthOrApiKey, hasPermission } from '@/lib/auth-helpers'
import { getUserStorageInfo, getUserByClerkId } from '@/lib/supabase-storage'
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { supabase } from '@/lib/supabase'

const s3Client = new S3Client({
  region: process.env.S3_REGION as string,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string
  }
})

// GET /api/user-data - Fetch user's data (files, folders, metadata)
export async function GET(request: NextRequest) {
  try {
    const auth = await validateAuthOrApiKey(request)

    if (!hasPermission(auth.permissions, 'read')) {
      return NextResponse.json(
        { error: 'Insufficient permissions', message: 'Read permission required' },
        { status: 403 }
      )
    }

    const user = await getUserByClerkId(auth.userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const dataType = searchParams.get('type') || 'overview'
    const prefix = searchParams.get('prefix') || ''
    const includeContent = searchParams.get('includeContent') === 'true'
    const limit = parseInt(searchParams.get('limit') || '100')

    switch (dataType) {
      case 'overview':
        return await getUserOverview(user, auth.userId)

      case 'files':
        return await getUserFiles(user, auth.userId, prefix, limit, includeContent)

      case 'folders':
        return await getUserFolders(user, auth.userId)

      case 'storage':
        return await getUserStorageStats(auth.userId)

      default:
        return NextResponse.json(
          { error: 'Invalid data type', message: 'Valid types: overview, files, folders, storage' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error fetching user data:', error)
    if (error instanceof NextResponse) {
      return error
    }
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    )
  }
}

async function getUserOverview(user: any, userId: string) {
  const storageInfo = await getUserStorageInfo(userId)

  // Get file count and recent files
  const { data: fileStats } = await supabase
    .from('user_files')
    .select('id, file_size, uploaded_at, content_type')
    .eq('user_id', user.id)
    .order('uploaded_at', { ascending: false })
    .limit(5)

  // Get folder count
  const { data: folderStats } = await supabase
    .from('user_folders')
    .select('id')
    .eq('user_id', user.id)

  const totalFiles = fileStats?.length || 0
  const totalFolders = folderStats?.length || 0
  const recentFiles = fileStats?.map(file => ({
    id: file.id,
    file_size: file.file_size,
    uploaded_at: file.uploaded_at,
    content_type: file.content_type
  })) || []

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      created_at: user.created_at
    },
    storage: {
      used: storageInfo.used,
      quota: storageInfo.quota,
      available: storageInfo.available,
      usage_percentage: Math.round((storageInfo.used / storageInfo.quota) * 100)
    },
    stats: {
      total_files: totalFiles,
      total_folders: totalFolders,
      recent_files: recentFiles
    }
  })
}

async function getUserFiles(user: any, userId: string, prefix: string, limit: number, includeContent: boolean) {
  const storageInfo = await getUserStorageInfo(userId)
  const bucketName = process.env.S3_BUCKET_NAME || 'general-s3-ui'

  // Build S3 prefix
  const s3Prefix = storageInfo.prefix + (prefix ? `/${prefix}` : '')

  // Get files from S3
  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: s3Prefix,
    MaxKeys: limit
  })

  const s3Result = await s3Client.send(command)

  // Get file metadata from database
  const { data: dbFiles } = await supabase
    .from('user_files')
    .select('*')
    .eq('user_id', user.id)
    .ilike('s3_key', `${s3Prefix}%`)
    .limit(limit)

  const files = await Promise.all((s3Result.Contents || []).map(async (s3File) => {
    const dbFile = dbFiles?.find(f => f.s3_key === s3File.Key)

    const fileData: any = {
      key: s3File.Key?.replace(`${storageInfo.prefix}/`, ''),
      size: s3File.Size,
      last_modified: s3File.LastModified,
      etag: s3File.ETag,
      storage_class: s3File.StorageClass,
      metadata: dbFile ? {
        id: dbFile.id,
        file_name: dbFile.file_name,
        content_type: dbFile.content_type,
        uploaded_at: dbFile.uploaded_at,
        last_accessed: dbFile.last_accessed
      } : null
    }

    // Include download URL if requested
    if (includeContent && s3File.Key) {
      try {
        const downloadUrl = await getSignedUrl(
          s3Client,
          new GetObjectCommand({
            Bucket: bucketName,
            Key: s3File.Key
          }),
          { expiresIn: 3600 } // 1 hour
        )
        fileData.download_url = downloadUrl
      } catch (error) {
        console.error('Error generating download URL:', error)
      }
    }

    return fileData
  }))

  return NextResponse.json({
    files,
    pagination: {
      count: files.length,
      is_truncated: s3Result.IsTruncated || false,
      next_continuation_token: s3Result.NextContinuationToken
    }
  })
}

async function getUserFolders(user: any, userId: string) {
  const { data: folders, error } = await supabase
    .from('user_folders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error

  const formattedFolders = folders?.map(folder => ({
    id: folder.id,
    folder_name: folder.folder_name,
    s3_prefix: folder.s3_prefix,
    parent_id: folder.parent_id,
    created_at: folder.created_at
  })) || []

  return NextResponse.json({ folders: formattedFolders })
}

async function getUserStorageStats(userId: string) {
  const storageInfo = await getUserStorageInfo(userId)

  // Get file type breakdown
  const { data: fileTypes } = await supabase
    .from('user_files')
    .select('content_type, file_size')
    .eq('user_id', (await getUserByClerkId(userId))?.id)

  const typeBreakdown = fileTypes?.reduce((acc: any, file) => {
    const type = file.content_type || 'unknown'
    const category = getFileCategory(type)

    if (!acc[category]) {
      acc[category] = { count: 0, size: 0 }
    }
    acc[category].count++
    acc[category].size += file.file_size

    return acc
  }, {}) || {}

  return NextResponse.json({
    storage: storageInfo,
    file_breakdown: typeBreakdown
  })
}

function getFileCategory(contentType: string): string {
  if (contentType.startsWith('image/')) return 'images'
  if (contentType.startsWith('video/')) return 'videos'
  if (contentType.startsWith('audio/')) return 'audio'
  if (contentType.includes('pdf')) return 'documents'
  if (contentType.includes('text/') || contentType.includes('application/json')) return 'text'
  if (contentType.includes('zip') || contentType.includes('archive')) return 'archives'
  return 'other'
}
