import { supabase } from './supabase'
import { Tables } from './db-types'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const DEFAULT_BUCKET = process.env.AWS_S3_BUCKET_NAME!

// S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

interface FileData {
  name: string
  path: string
  size: number
  is_folder: boolean
}

export async function getUserByClerkId(clerkId: string): Promise<Tables<'users'> | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', clerkId)
    .single()

  if (error) {
    console.error('Error fetching user:', error)
    return null
  }

  return data
}

export async function createFolder(
  clerkId: string,
  folderName: string,
  parentPath: string = ''
): Promise<Tables<'files'> | null> {
  try {
    const user = await getUserByClerkId(clerkId)
    if (!user) {
      throw new Error(`User not found for clerk_id: ${clerkId}`)
    }

    // Normalize path
    const normalizedParentPath = parentPath === '/' ? '' : parentPath
    const folderPath = normalizedParentPath 
      ? `${normalizedParentPath}/${folderName}` 
      : folderName

    // Check if folder already exists
    const { data: existingFolder } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', user.id)
      .eq('path', folderPath)
      .eq('is_folder', true)
      .single()

    if (existingFolder) {
      return existingFolder
    }

    // Create the folder in database
    const { data, error } = await supabase
      .from('files')
      .insert({
        user_id: user.id,
        name: folderName,
        path: folderPath,
        size: 0,
        is_folder: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating folder:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to create folder:', error)
    return null
  }
}

export async function listFiles(
  clerkId: string,
  path: string = ''
): Promise<Tables<'files'>[]> {
  try {
    const user = await getUserByClerkId(clerkId)
    if (!user) {
      throw new Error(`User not found for clerk_id: ${clerkId}`)
    }

    // If path is empty or '/', list root files
    const isRoot = !path || path === '/'

    const query = supabase
      .from('files')
      .select('*')
      .eq('user_id', user.id)

    if (isRoot) {
      // In root, we want files with no '/' in their path
      query.not('path', 'ilike', '%/%')
    } else {
      // For directories, we want files directly under that path
      // This regex matches files directly under the path, not in subdirectories
      const dirPath = path.endsWith('/') ? path : `${path}/`
      query.ilike('path', `${dirPath}%`).not('path', 'ilike', `${dirPath}%/%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error listing files:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Failed to list files:', error)
    return []
  }
}

export async function uploadFile(
  clerkId: string, 
  file: File, 
  path: string = ''
): Promise<Tables<'files'> | null> {
  try {
    const user = await getUserByClerkId(clerkId)
    if (!user) {
      throw new Error(`User not found for clerk_id: ${clerkId}`)
    }

    // Check if user has enough storage
    if (user.storage_used + file.size > user.storage_quota) {
      throw new Error('Storage quota exceeded')
    }

    // Normalize path
    const normalizedPath = path === '/' ? '' : path
    const filePath = normalizedPath 
      ? `${normalizedPath}/${file.name}` 
      : file.name

    // Create the file in S3
    const s3Key = `${user.bucket_prefix}/${filePath}`
    const fileBuffer = await file.arrayBuffer()

    await s3Client.send(new PutObjectCommand({
      Bucket: DEFAULT_BUCKET,
      Key: s3Key,
      Body: Buffer.from(fileBuffer),
      ContentType: file.type || 'application/octet-stream',
    }))

    // Create the file record in database
    const { data, error } = await supabase
      .from('files')
      .insert({
        user_id: user.id,
        name: file.name,
        path: filePath,
        size: file.size,
        is_folder: false,
      })
      .select()
      .single()

    if (error) {
      // If database insertion fails, try to delete the S3 file
      try {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: DEFAULT_BUCKET,
          Key: s3Key,
        }))
      } catch (s3Error) {
        console.error('Failed to delete S3 file after database error:', s3Error)
      }
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to upload file:', error)
    return null
  }
}

export async function deleteFile(
  clerkId: string,
  fileId: string
): Promise<boolean> {
  try {
    const user = await getUserByClerkId(clerkId)
    if (!user) {
      throw new Error(`User not found for clerk_id: ${clerkId}`)
    }

    // Get the file
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !file) {
      throw new Error(`File not found: ${fileId}`)
    }

    // If it's a folder, check if it has contents
    if (file.is_folder) {
      const { data: contents, error: contentsError } = await supabase
        .from('files')
        .select('id')
        .eq('user_id', user.id)
        .ilike('path', `${file.path}/%`)
        .limit(1)

      if (contentsError) {
        throw new Error(`Error checking folder contents: ${contentsError.message}`)
      }

      if (contents && contents.length > 0) {
        throw new Error('Cannot delete non-empty folder')
      }
    } else {
      // Delete the file from S3
      const s3Key = `${user.bucket_prefix}/${file.path}`
      await s3Client.send(new DeleteObjectCommand({
        Bucket: DEFAULT_BUCKET,
        Key: s3Key,
      }))
    }

    // Delete the file record
    const { error: deleteError } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId)
      .eq('user_id', user.id)

    if (deleteError) {
      throw new Error(`Error deleting file record: ${deleteError.message}`)
    }

    return true
  } catch (error) {
    console.error('Failed to delete file:', error)
    return false
  }
}

export async function getUserStorageInfo(clerkId: string) {
  const user = await getUserByClerkId(clerkId)
  if (!user) {
    return null
  }

  return {
    quota: user.storage_quota,
    used: user.storage_used,
    available: user.storage_quota - user.storage_used,
    bucketPrefix: user.bucket_prefix,
  }
}

export async function renameFile(
  clerkId: string,
  fileId: string,
  newName: string
): Promise<Tables<'files'> | null> {
  try {
    const user = await getUserByClerkId(clerkId)
    if (!user) {
      throw new Error(`User not found for clerk_id: ${clerkId}`)
    }

    // Get the file
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !file) {
      throw new Error(`File not found: ${fileId}`)
    }

    // Generate new path
    const pathParts = file.path.split('/')
    pathParts[pathParts.length - 1] = newName
    const newPath = pathParts.join('/')

    // If it's a file (not a folder), we need to copy the file in S3
    if (!file.is_folder) {
      const oldS3Key = `${user.bucket_prefix}/${file.path}`
      const newS3Key = `${user.bucket_prefix}/${newPath}`

      // Read the object from S3
      const { Body, ContentType } = await s3Client.send({
        Bucket: DEFAULT_BUCKET,
        Key: oldS3Key
      })

      // Upload to new key
      await s3Client.send(new PutObjectCommand({
        Bucket: DEFAULT_BUCKET,
        Key: newS3Key,
        Body,
        ContentType
      }))

      // Delete the old file
      await s3Client.send(new DeleteObjectCommand({
        Bucket: DEFAULT_BUCKET,
        Key: oldS3Key
      }))
    }

    // Update the file record
    const { data, error } = await supabase
      .from('files')
      .update({
        name: newName,
        path: newPath
      })
      .eq('id', fileId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Error updating file record: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Failed to rename file:', error)
    return null
  }
}

export async function moveFile(
  clerkId: string,
  fileId: string,
  targetFolderId: string | null // null means move to root
): Promise<Tables<'files'> | null> {
  try {
    const user = await getUserByClerkId(clerkId)
    if (!user) {
      throw new Error(`User not found for clerk_id: ${clerkId}`)
    }

    // Get the file
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !file) {
      throw new Error(`File not found: ${fileId}`)
    }

    // Get target folder path (empty string for root)
    let targetPath = ''
    if (targetFolderId) {
      const { data: targetFolder, error: targetError } = await supabase
        .from('files')
        .select('path')
        .eq('id', targetFolderId)
        .eq('user_id', user.id)
        .eq('is_folder', true)
        .single()

      if (targetError || !targetFolder) {
        throw new Error(`Target folder not found: ${targetFolderId}`)
      }

      targetPath = targetFolder.path
    }

    // Generate new path
    const fileName = file.name
    const newPath = targetPath ? `${targetPath}/${fileName}` : fileName

    // Check if destination file already exists
    const { data: existingFile } = await supabase
      .from('files')
      .select('id')
      .eq('user_id', user.id)
      .eq('path', newPath)
      .single()

    if (existingFile) {
      throw new Error(`A file with the same name already exists in the destination folder`)
    }

    // If it's a file (not a folder), we need to copy the file in S3
    if (!file.is_folder) {
      const oldS3Key = `${user.bucket_prefix}/${file.path}`
      const newS3Key = `${user.bucket_prefix}/${newPath}`

      // Read the object from S3
      const { Body, ContentType } = await s3Client.send({
        Bucket: DEFAULT_BUCKET,
        Key: oldS3Key
      })

      // Upload to new key
      await s3Client.send(new PutObjectCommand({
        Bucket: DEFAULT_BUCKET,
        Key: newS3Key,
        Body,
        ContentType
      }))

      // Delete the old file
      await s3Client.send(new DeleteObjectCommand({
        Bucket: DEFAULT_BUCKET,
        Key: oldS3Key
      }))
    } else {
      // If it's a folder, we need to move all its contents too
      // TODO: Implement recursive folder move
      // This is complex and requires batch operations
      // For now, we'll just throw an error
      throw new Error(`Moving folders is not supported yet`)
    }

    // Update the file record
    const { data, error } = await supabase
      .from('files')
      .update({
        path: newPath
      })
      .eq('id', fileId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Error updating file record: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Failed to move file:', error)
    return null
  }
}
