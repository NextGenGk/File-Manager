import { createHash, randomBytes } from 'crypto'
import { supabase } from './supabase'

export interface ApiKey {
  id: string
  user_id: string
  key_name: string
  api_key: string
  permissions: string[]
  is_active: boolean
  last_used: Date | null
  expires_at: Date | null
  created_at: Date
  updated_at: Date
}

export interface CreateApiKeyParams {
  userId: string
  keyName: string
  permissions?: string[]
  expiresAt?: Date
}

/**
 * Generate a new API key
 */
export function generateApiKey(): string {
  const prefix = 'sk'
  const randomPart = randomBytes(32).toString('hex')
  return `${prefix}_${randomPart}`
}

/**
 * Hash an API key for secure storage
 */
export function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex')
}

/**
 * Create a new API key for a user
 */
export async function createApiKey({
  userId,
  keyName,
  permissions = ['read'],
  expiresAt
}: CreateApiKeyParams): Promise<{ apiKey: ApiKey; plainKey: string }> {
  const plainKey = generateApiKey()
  const hashedKey = hashApiKey(plainKey)

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      user_id: userId,
      key_name: keyName,
      api_key: hashedKey, // Store hashed key for validation
      api_key_hash: hashedKey, // Also store in the dedicated hash column
      permissions,
      expires_at: expiresAt?.toISOString()
    })
    .select()
    .single()

  if (error) throw error

  return { apiKey: data, plainKey }
}

/**
 * Validate an API key and return user info
 */
export async function validateApiKey(apiKey: string): Promise<{ userId: string; permissions: string[] } | null> {
  const hashedKey = hashApiKey(apiKey)

  const { data, error } = await supabase
    .from('api_keys')
    .select(`
      user_id,
      permissions,
      is_active,
      expires_at,
      users!inner(id, clerk_id)
    `)
    .eq('api_key', hashedKey)
    .eq('is_active', true)
    .single()

  if (error || !data) return null

  // Check if key has expired
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return null
  }

  // Update last_used timestamp
  await supabase
    .from('api_keys')
    .update({ last_used: new Date().toISOString() })
    .eq('api_key', hashedKey)

  // Extract clerk_id from the users object returned by Supabase
  // Define proper type for the joined users data from Supabase
  type UserRecord = {
    id: string;
    clerk_id: string;
  };

  // Cast with proper type information
  const user = data.users[0] as UserRecord;
  return {
    userId: user.clerk_id,
    permissions: data.permissions
  }
}

/**
 * Get user's API keys
 */
export async function getUserApiKeys(userId: string): Promise<ApiKey[]> {
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(keyId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('api_keys')
    .update({ is_active: false })
    .eq('id', keyId)
    .eq('user_id', userId)

  if (error) throw error
}

/**
 * Delete an API key permanently
 */
export async function deleteApiKey(keyId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('api_keys')
    .delete()
    .eq('id', keyId)
    .eq('user_id', userId)

  if (error) throw error
}
