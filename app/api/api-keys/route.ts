import { NextRequest, NextResponse } from 'next/server'
import { validateAuth } from '@/lib/auth-helpers'
import { createApiKey, getUserApiKeys, revokeApiKey, deleteApiKey } from '@/lib/api-key-helpers'
import { getUserByClerkId } from '@/lib/supabase-storage'
import { ApiError } from '@/lib/api-error-handler'

// GET /api/api-keys - List user's API keys
export async function GET() {
  try {
    const userId = await validateAuth()

    const user = await getUserByClerkId(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const apiKeys = await getUserApiKeys(user.id)

    // Remove sensitive data before returning
    const sanitizedKeys = apiKeys.map(key => ({
      id: key.id,
      key_name: key.key_name,
      permissions: key.permissions,
      is_active: key.is_active,
      last_used: key.last_used,
      expires_at: key.expires_at,
      created_at: key.created_at,
      // Never return the actual API key
      api_key: `sk_****${key.api_key.slice(-4)}`
    }))

    return NextResponse.json({ apiKeys: sanitizedKeys })
  } catch (error) {
    console.error('Error fetching API keys:', error)
    if (error instanceof NextResponse) {
      return error
    }
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    )
  }
}

// POST /api/api-keys - Create new API key
export async function POST(request: NextRequest) {
  try {
    const userId = await validateAuth()

    const user = await getUserByClerkId(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { keyName, permissions = ['read'], expiresAt } = body

    if (!keyName || typeof keyName !== 'string') {
      return NextResponse.json(
        { error: 'Key name is required' },
        { status: 400 }
      )
    }

    // Validate permissions
    const validPermissions = ['read', 'write', 'delete']
    if (!Array.isArray(permissions) || !permissions.every(p => validPermissions.includes(p))) {
      return NextResponse.json(
        { error: 'Invalid permissions. Must be array of: read, write, delete' },
        { status: 400 }
      )
    }

    const expirationDate = expiresAt ? new Date(expiresAt) : undefined
    if (expirationDate && expirationDate <= new Date()) {
      return NextResponse.json(
        { error: 'Expiration date must be in the future' },
        { status: 400 }
      )
    }

    const { apiKey, plainKey } = await createApiKey({
      userId: user.id,
      keyName,
      permissions,
      expiresAt: expirationDate
    })

    return NextResponse.json({
      message: 'API key created successfully',
      apiKey: {
        id: apiKey.id,
        key_name: apiKey.key_name,
        permissions: apiKey.permissions,
        expires_at: apiKey.expires_at,
        created_at: apiKey.created_at
      },
      // Return the plain key only once - user must save it
      key: plainKey,
      warning: 'This is the only time you will see the full API key. Please save it securely.'
    })
  } catch (error) {
    console.error('Error creating API key:', error)
    if (error instanceof NextResponse) {
      return error
    }
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    )
  }
}

// DELETE /api/api-keys - Revoke or delete API key
export async function DELETE(request: NextRequest) {
  try {
    const userId = await validateAuth()

    const user = await getUserByClerkId(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const keyId = searchParams.get('keyId')
    const action = searchParams.get('action') || 'revoke' // 'revoke' or 'delete'

    if (!keyId) {
      return NextResponse.json(
        { error: 'API key ID is required' },
        { status: 400 }
      )
    }

    if (action === 'delete') {
      await deleteApiKey(keyId, user.id)
      return NextResponse.json({ message: 'API key deleted successfully' })
    } else {
      await revokeApiKey(keyId, user.id)
      return NextResponse.json({ message: 'API key revoked successfully' })
    }
  } catch (error) {
    console.error('Error managing API key:', error)
    if (error instanceof NextResponse) {
      return error
    }
    return NextResponse.json(
      { error: 'Failed to manage API key' },
      { status: 500 }
    )
  }
}
