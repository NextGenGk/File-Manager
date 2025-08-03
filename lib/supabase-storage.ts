import { supabase } from './supabase'
import { User } from '@clerk/nextjs/server'

export async function getUserByClerkId(clerkId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', clerkId)
    .single()

  if (error) return null
  return data
}

export async function createOrUpdateUser(userData: User) {
  const { id: clerkId, emailAddresses, firstName, lastName, imageUrl } = userData

  const email = emailAddresses[0]?.emailAddress
  if (!email) throw new Error('No email address found')

  // Create unique bucket prefix for user
  const bucketPrefix = `user-${clerkId.slice(-8)}`

  const { data, error } = await supabase
    .from('users')
    .upsert({
      clerk_id: clerkId,
      email,
      first_name: firstName,
      last_name: lastName,
      image_url: imageUrl,
      bucket_prefix: bucketPrefix,
      storage_quota: 5 * 1024 * 1024 * 1024, // 5GB default
      storage_used: 0,
    }, {
      onConflict: 'clerk_id'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getUserStorageInfo(clerkId: string) {
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('storage_used, storage_quota, bucket_prefix')
    .eq('clerk_id', clerkId)
    .single()

  if (fetchError || !user) {
    throw new Error('Failed to fetch user storage info')
  }

  return {
    used: user.storage_used,
    quota: user.storage_quota,
    available: user.storage_quota - user.storage_used,
    prefix: user.bucket_prefix
  }
}

export async function updateUserStorageUsed(clerkId: string, sizeChange: number) {
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

  const { error } = await supabase
    .from('user_files')
    .delete()
    .eq('user_id', user.id)
    .eq('s3_key', s3Key)

  if (error) throw error
}
