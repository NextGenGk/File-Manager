import { supabase } from './supabase'
import { User } from '@clerk/nextjs/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const DEFAULT_BUCKET = process.env.AWS_S3_BUCKET_NAME!

// Type definitions
type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']

interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          clerk_id: string
          email: string
          first_name: string | null
          last_name: string | null
          image_url: string | null
          bucket_prefix: string
          storage_quota: number
          storage_used: number
          created_at: string
          updated_at: string
        }
      }
    }
  }
}

export async function createUserS3Directory(userId: string, bucketPrefix: string): Promise<boolean> {
  try {
    const welcomeKey = `${bucketPrefix}/welcome.txt`
    const welcomeContent = `Welcome to your personal storage space!\n\nThis directory was created for user: ${userId}\nCreated at: ${new Date().toISOString()}`

    await s3Client.send(new PutObjectCommand({
      Bucket: DEFAULT_BUCKET,
      Key: welcomeKey,
      Body: welcomeContent,
      ContentType: 'text/plain'
    }))

    return true
  } catch (error) {
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
          storage_quota: 2 * 1024 * 1024 * 1024, // 2GB default quota
          storage_used: 0,
        })
        .select()
        .single()

      if (error) throw error
      user = data

      // Create S3 directory for new users
      await createUserS3Directory(clerkUser.id, bucketPrefix)
    }

    return user
  } catch (error) {
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
    return
  }

  const newSize = user.storage_used + sizeChange

  // Update the user's storage used
  const { error: updateError } = await supabase
    .from('users')
    .update({ storage_used: newSize })
    .eq('clerk_id', clerkId)

  if (updateError) {
    // Silently handle error
  }
}

export async function createUserFile(
  clerkId: string,
  s3Key: string,
  fileName: string,
  fileSize: number,
  contentType: string | null = null,
  folderId: string | null = null
) {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkId)
      .single()

    if (userError || !user) {
      throw new Error(`User not found for clerk_id: ${clerkId}`)
    }

    const { data, error } = await supabase
      .from('user_files')
      .insert({
        user_id: user.id,
        s3_key: s3Key,
        file_name: fileName,
        file_size: fileSize,
        content_type: contentType,
        folder_id: folderId
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    throw error
  }
}

export async function deleteUserFile(clerkId: string, s3Key: string) {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkId)
      .single()

    if (userError || !user) {
      throw new Error(`User not found for clerk_id: ${clerkId}`)
    }

    const { error } = await supabase
      .from('user_files')
      .delete()
      .eq('user_id', user.id)
      .eq('s3_key', s3Key)

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    throw error
  }
}

export async function getUserFiles(clerkId: string) {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkId)
      .single()

    if (userError || !user) {
      throw new Error(`User not found for clerk_id: ${clerkId}`)
    }

    const { data: files, error } = await supabase
      .from('user_files')
      .select('*')
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false })

    if (error) {
      throw error
    }

    return files || []
  } catch (error) {
    throw error
  }
}
