import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { createOrUpdateUser } from '@/lib/supabase-storage'

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

export async function POST(req: Request) {
  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  // Get the body
  const payload = await req.text()

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(webhookSecret)

  let evt: { type: string; data: Record<string, unknown> }

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as { type: string; data: Record<string, unknown> }
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  // Handle the webhook
  const { type, data } = evt

  console.log(`Received webhook: ${type}`)

  switch (type) {
    case 'user.created':
    case 'user.updated': {
      try {
        console.log('Processing user:', data.id)
        
        // Convert Clerk user data to our format
        const userForSync = {
          id: data.id as string,
          firstName: data.first_name as string | null,
          lastName: data.last_name as string | null,
          emailAddresses: data.email_addresses as Array<{emailAddress?: string}>,
          imageUrl: data.image_url as string,
        }

        await createOrUpdateUser(userForSync)
        console.log(`Successfully synced user ${data.id}`)
        
        return NextResponse.json({ success: true })
      } catch (error) {
        console.error('Error syncing user:', error)
        return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 })
      }
    }
    
    case 'user.deleted': {
      // Handle user deletion if needed
      console.log(`User deleted: ${data.id}`)
      // You can add logic to soft-delete or archive user data here
      return NextResponse.json({ success: true })
    }
    
    default:
      console.log(`Unhandled webhook type: ${type}`)
      return NextResponse.json({ success: true })
  }
}
