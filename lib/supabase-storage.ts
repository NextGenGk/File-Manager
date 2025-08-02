import { supabase, type Tables } from './supabase'
import { User } from '@clerk/nextjs/server'
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY as string,
    secretAccessKey: process.env.AWS_SECRET_KEY as string
  }
})

const DEFAULT_BUCKET = 'general-s3-ui'

async function createUserS3Directory(userId: string, userPrefix: string) {
  try {
    // Create a welcome file in the user's directory to ensure the directory exists
    const welcomeKey = `${userPrefix}/welcome.txt`

    // Check if directory already exists
    try {
      await s3Client.send(new HeadObjectCommand({
        Bucket: DEFAULT_BUCKET,
        Key: welcomeKey
      }))
      console.log(`S3 directory already exists for user: ${userId}`)
      return true
    } catch (error) {
      // Directory doesn't exist, create it
    }

    const welcomeContent = `Welcome to your personal S3 storage!

This is your private storage space where you can upload and manage your files.

User ID: ${userId}
Created: ${new Date().toISOString()}

You can safely delete this file once you start uploading your own content.
`

    await s3Client.send(new PutObjectCommand({
      Bucket: DEFAULT_BUCKET,
      Key: welcomeKey,
      Body: welcomeContent,
      ContentType: 'text/plain'
    }))

    console.log(`Successfully created S3 directory for user: ${userId}`)
    return true
  } catch (error) {
    console.error(`Failed to create S3 directory for user ${userId}:`, error)
    return false
  }
}

export async function createOrUpdateUser(clerkUser: User) {
  const bucketPrefix = `user-${clerkUser.id}`
  const userName = clerkUser.firstName || clerkUser.emailAddresses[0]?.emailAddress?.split('@')[0] || 'user'

  try {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkUser.id)
      .single()

    let user
    if (existingUser) {
      // Update existing user
      const { data, error } = await supabase
        .from('users')
        .update({
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          first_name: clerkUser.firstName,
          last_name: clerkUser.lastName,
          image_url: clerkUser.imageUrl,
        })
        .eq('clerk_id', clerkUser.id)
        .select()
        .single()

      if (error) throw error
      user = data
    } else {
      // Create new user
      const { data, error } = await supabase
        .from('users')
        .insert({
          clerk_id: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          first_name: clerkUser.firstName,
          last_name: clerkUser.lastName,
          image_url: clerkUser.imageUrl,
          bucket_prefix: bucketPrefix,
          storage_quota: 5 * 1024 * 1024 * 1024, // 5GB default quota
          storage_used: 0,
        })
        .select()
        .single()

      if (error) throw error
      user = data

      // Create S3 directory for new users
      await createUserS3Directory(clerkUser.id, bucketPrefix)
    }

    console.log(`User ${userName} (${clerkUser.id}) storage initialized successfully`)
    return user
  } catch (error) {
    console.error(`Failed to create/update user ${clerkUser.id}:`, error)
    throw error
  }
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

export async function getUserStorageInfo(clerkId: string) {
  const { data: user, error } = await supabase
    .from('users')
    .select('storage_quota, storage_used, bucket_prefix')
    .eq('clerk_id', clerkId)
    .single()

  if (error || !user) {
    console.error('Error fetching storage info:', error)
    return null
  }

  return {
    quota: user.storage_quota,
    used: user.storage_used,
    available: user.storage_quota - user.storage_used,
    prefix: user.bucket_prefix,
  }
}

export async function updateUserStorageUsed(clerkId: string, sizeChange: number) {
  // First get current storage used
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('storage_used')
    .eq('clerk_id', clerkId)
    .single()

  if (fetchError || !user) {
    throw new Error('Failed to fetch user storage info')
  }

  const newStorageUsed = user.storage_used + sizeChange

  const { data, error } = await supabase
    .from('users')
    .update({ storage_used: newStorageUsed })
    .eq('clerk_id', clerkId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function createUserFile(data: {
  clerkId: string
  s3Key: string
  fileName: string
  fileSize: number
  contentType?: string
  folderId?: string
}) {
  // Get user ID from clerk ID
  const user = await getUserByClerkId(data.clerkId)
  if (!user) throw new Error('User not found')

  const { data: file, error } = await supabase
    .from('user_files')
    .insert({
      user_id: user.id,
      s3_key: data.s3Key,
      file_name: data.fileName,
      file_size: data.fileSize,
      content_type: data.contentType,
      folder_id: data.folderId,
    })
    .select()
    .single()

  if (error) throw error
  return file
}

export async function deleteUserFile(clerkId: string, s3Key: string) {
  // Get user ID from clerk ID
  const user = await getUserByClerkId(clerkId)
  if (!user) throw new Error('User not found')

  const { data, error } = await supabase
    .from('user_files')
    .delete()
    .eq('user_id', user.id)
    .eq('s3_key', s3Key)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getUserFiles(clerkId: string, folderId?: string) {
  // Get user ID from clerk ID
  const user = await getUserByClerkId(clerkId)
  if (!user) throw new Error('User not found')

  let query = supabase
    .from('user_files')
    .select('*')
    .eq('user_id', user.id)

  if (folderId) {
    query = query.eq('folder_id', folderId)
  } else {
    query = query.is('folder_id', null)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function getUserFolders(clerkId: string, parentId?: string) {
  // Get user ID from clerk ID
  const user = await getUserByClerkId(clerkId)
  if (!user) throw new Error('User not found')

  let query = supabase
    .from('user_folders')
    .select('*')
    .eq('user_id', user.id)

  if (parentId) {
    query = query.eq('parent_id', parentId)
  } else {
    query = query.is('parent_id', null)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}
