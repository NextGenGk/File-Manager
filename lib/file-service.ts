import { supabase } from './supabase'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const DEFAULT_BUCKET = process.env.AWS_S3_BUCKET_NAME!

// Type definitions
interface User {
  id: string
  clerk_id: string
  email: string
  first_name: string
  last_name: string
  bucket_prefix: string
  storage_used: number
  storage_quota: number
  created_at: string
  updated_at: string
}

interface UserFile {
  id: string
  user_id: string
  s3_key: string
  file_name: string
  file_size: number
  content_type: string
  uploaded_at: string
  last_accessed: string
}

interface UserWithFiles extends UserFile {
  user: {
    clerk_id: string
    email: string
    first_name: string
    last_name: string
  }
}

interface StorageInfo {
  quota: number
  used: number
  available: number
  bucketPrefix: string
}

// S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function getUserByClerkId(clerkId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', clerkId)
    .single()

  if (error) {
    console.error('Error fetching user:', error)
    return null
  }

  return data as User
}

export async function createFolder(_clerkId: string, _folderName: string, _parentPath?: string): Promise<null> {
  console.warn('Folder creation not implemented - current schema uses user_files table')
  return null
}

export async function listFiles(clerkId: string, _path?: string): Promise<UserFile[]> {
  try {
    const user = await getUserByClerkId(clerkId)
    if (!user) {
      console.error(`User not found for clerk_id: ${clerkId}`)
      return []
    }

    const { data: files, error } = await supabase
      .from('user_files')
      .select('*')
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('Error listing files:', error)
      return []
    }

    return (files || []) as UserFile[]
  } catch (error) {
    console.error('Failed to list files:', error)
    return []
  }
}

export async function uploadFile(clerkId: string, file: File, _path?: string): Promise<UserFile | null> {
  try {
    const user = await getUserByClerkId(clerkId)
    if (!user) {
      console.error(`User not found for clerk_id: ${clerkId}`)
      return null
    }

    const fileName = file.name
    const s3Key = `${user.bucket_prefix}/${fileName}`
    
    const buffer = Buffer.from(await file.arrayBuffer())

    await s3Client.send(new PutObjectCommand({
      Bucket: DEFAULT_BUCKET,
      Key: s3Key,
      Body: buffer,
      ContentType: file.type || 'application/octet-stream',
    }))

    const { data, error } = await supabase
      .from('user_files')
      .insert({
        user_id: user.id,
        s3_key: fileName,
        file_name: fileName,
        file_size: file.size,
        content_type: file.type || 'application/octet-stream',
        uploaded_at: new Date().toISOString(),
        last_accessed: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving file metadata:', error)
      return null
    }

    return data as UserFile
  } catch (error) {
    console.error('Failed to upload file:', error)
    return null
  }
}

export async function deleteFile(clerkId: string, fileId: string): Promise<boolean> {
  try {
    const user = await getUserByClerkId(clerkId)
    if (!user) {
      console.error(`User not found for clerk_id: ${clerkId}`)
      return false
    }

    const { data: file, error: fetchError } = await supabase
      .from('user_files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !file) {
      console.error('File not found:', fileId)
      return false
    }

    const s3Key = `${user.bucket_prefix}/${(file as UserFile).s3_key}`
    await s3Client.send(new DeleteObjectCommand({
      Bucket: DEFAULT_BUCKET,
      Key: s3Key,
    }))

    const { error } = await supabase
      .from('user_files')
      .delete()
      .eq('id', fileId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting file record:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to delete file:', error)
    return false
  }
}

export async function renameFile(clerkId: string, fileId: string, newName: string): Promise<UserFile | null> {
  try {
    const user = await getUserByClerkId(clerkId)
    if (!user) {
      console.error(`User not found for clerk_id: ${clerkId}`)
      return null
    }

    const { data, error } = await supabase
      .from('user_files')
      .update({
        file_name: newName,
        s3_key: newName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', fileId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error renaming file:', error)
      return null
    }

    return data as UserFile
  } catch (error) {
    console.error('Failed to rename file:', error)
    return null
  }
}

export async function moveFile(_clerkId: string, _fileId: string, _targetFolderId: string | null): Promise<UserFile | null> {
  console.warn('Move file operation is not fully implemented due to schema limitations')
  return null
}

/**
 * Fetch all files regardless of user (admin/debug use case)
 * @returns Array of all files with user information
 */
export async function getAllFiles(): Promise<UserWithFiles[]> {
  try {
    const { data: files, error } = await supabase
      .from('user_files')
      .select(`
        *,
        users!inner(
          clerk_id,
          email,
          first_name,
          last_name
        )
      `)
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('Error getting all files:', error)
      return []
    }

    const transformedFiles = files.map((file) => ({
      id: file.id,
      user_id: file.user_id,
      s3_key: file.s3_key,
      file_name: file.file_name,
      file_size: file.file_size,
      content_type: file.content_type,
      uploaded_at: file.uploaded_at,
      last_accessed: file.last_accessed,
      user: {
        clerk_id: file.users?.clerk_id,
        email: file.users?.email,
        first_name: file.users?.first_name,
        last_name: file.users?.last_name
      }
    }));

    return transformedFiles as UserWithFiles[];
  } catch (error) {
    console.error('Failed to fetch all files:', error);
    return [];
  }
}

export async function getUserStorageInfo(clerkId: string): Promise<StorageInfo | null> {
  try {
    const user = await getUserByClerkId(clerkId)
    if (!user) {
      return null
    }

    // Calculate storage used
    const { data: files, error } = await supabase
      .from('user_files')
      .select('file_size')
      .eq('user_id', user.id)

    if (error) {
      console.error('Error calculating storage:', error)
      return null
    }

    const storageUsed = files?.reduce((total, file) => total + (file.file_size || 0), 0) || 0
    const storageQuota = 1073741824 // 1GB in bytes

    return {
      quota: storageQuota,
      used: storageUsed,
      available: storageQuota - storageUsed,
      bucketPrefix: user.bucket_prefix,
    }
  } catch (error) {
    console.error('Failed to get storage info:', error)
    return null
  }
}
