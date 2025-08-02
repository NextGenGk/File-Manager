import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createOrUpdateUser } from '@/lib/user-storage'

export async function POST(req: NextRequest) {
  console.log('Webhook received')
  
  try {
    // Get the headers
    const headerPayload = headers()
    const svix_id = headerPayload.get('svix-id')
    const svix_timestamp = headerPayload.get('svix-timestamp')
    const svix_signature = headerPayload.get('svix-signature')

    console.log('Headers:', { svix_id, svix_timestamp, svix_signature })

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('Missing svix headers')
      return new NextResponse('Error: Missing svix headers', {
        status: 400,
      })
    }

    // Check if webhook secret is configured
    if (!process.env.CLERK_WEBHOOK_SECRET) {
      console.error('CLERK_WEBHOOK_SECRET not configured')
      return new NextResponse('Error: Webhook secret not configured', {
        status: 500,
      })
    }

    // Get the body
    const payload = await req.json()
    const body = JSON.stringify(payload)
    
    console.log('Payload type:', payload.type)

    // Create a new Svix instance with your secret.
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET)

    let evt: WebhookEvent

    // Verify the payload with the headers
    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as WebhookEvent
      
      console.log('Webhook verified successfully')
    } catch (err) {
      console.error('Error verifying webhook:', err)
      return new NextResponse('Error: Invalid webhook signature', {
        status: 400,
      })
    }

    // Handle the webhook
    const eventType = evt.type
    console.log('Processing event type:', eventType)

    if (eventType === 'user.created' || eventType === 'user.updated') {
      try {
        await createOrUpdateUser(evt.data)
        console.log(`User ${eventType.split('.')[1]} successfully:`, evt.data.id)
      } catch (error) {
        console.error(`Error ${eventType.split('.')[1]} user:`, error)
        return new NextResponse('Error processing user data', { status: 500 })
      }
    }

    console.log('Webhook processed successfully')
    return new NextResponse('OK', { status: 200 })
    
  } catch (error) {
    console.error('Webhook error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

// Add GET method for webhook verification/testing
export async function GET(req: NextRequest) {
  return new NextResponse('Clerk webhook endpoint is active', { status: 200 })
}
