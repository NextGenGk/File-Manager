import { supabase } from './supabase'
import { Tables } from './db-types'
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

async function createUserS3Directory(userId: string, bucketPrefix: string): Promise<boolean> {
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
    console.error('Error creating S3 directory:', error)
    return false
  }
}

interface PartialClerkUser {
  id: string
  firstName: string | null
  lastName: string | null
  emailAddresses: Array<{emailAddress?: string}>
  imageUrl: string
}

export async function createOrUpdateUser(clerkUser: User | PartialClerkUser): Promise<Tables<'users'> | null> {
  const bucketPrefix = `user-${clerkUser.id}`

  try {
    // Validate required data
    if (!clerkUser.id) {
      throw new Error('Clerk user ID is required')
    }

    if (!clerkUser.emailAddresses?.[0]?.emailAddress) {
      throw new Error('User email address is required')
    }

    console.log('Creating/updating user with Clerk ID:', clerkUser.id)

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkUser.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for new users
      console.error('Error fetching existing user:', fetchError)
      throw new Error(`Database fetch error: ${fetchError.message || 'Unknown database error'}`)
    }

    let user
    if (existingUser) {
      console.log('Updating existing user:', existingUser.id)
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

      if (error) {
        console.error('Error updating user:', error)
        throw new Error(`Failed to update user: ${error.message}`)
      }
      user = data
    } else {
      console.log('Creating new user for Clerk ID:', clerkUser.id)
      // Use upsert to avoid duplicate key errors
      const { data, error } = await supabase
        .from('users')
        .upsert({
          clerk_id: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          first_name: clerkUser.firstName,
          last_name: clerkUser.lastName,
          image_url: clerkUser.imageUrl,
          bucket_prefix: bucketPrefix,
          storage_quota: 1073741824, // 1GB default quota
          storage_used: 0,
        }, { onConflict: 'clerk_id' })
        .select()
        .single()

      if (error) {
        console.error('Error creating user:', error)
        throw new Error(`Failed to create user: ${error.message}`)
      }
      user = data

      // Create S3 directory for new users
      console.log('Creating S3 directory for new user:', bucketPrefix)
      const s3Success = await createUserS3Directory(clerkUser.id, bucketPrefix)
      if (!s3Success) {
        console.warn('Failed to create S3 directory, but user was created successfully')
      }
    }

    console.log('User sync completed successfully:', user.id)
    return user
  } catch (error) {
    console.error('createOrUpdateUser failed:', error)
    if (error instanceof Error) {
      throw error
    } else {
      throw new Error(`Unknown error during user sync: ${JSON.stringify(error)}`)
    }
  }
}

export async function getUserByClerkId(clerkId: string): Promise<Tables<'users'> | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', clerkId)
    .single()

  if (error) {
    console.error('Error fetching user by clerk ID:', error)
    return null
  }

  return data
}

export async function updateUserStorageQuota(userId: string, newQuota: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ storage_quota: newQuota })
      .eq('id', userId)

    return !error
  } catch (error) {
    console.error('Error updating storage quota:', error)
    return false
  }
}
