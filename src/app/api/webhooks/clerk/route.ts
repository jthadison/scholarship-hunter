import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { WebhookEvent } from '@clerk/nextjs/server'
import { prisma } from '@/server/db'

export async function POST(req: Request) {
  // Get webhook secret from environment
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('CLERK_WEBHOOK_SECRET is not set in environment variables')
  }

  // Get headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse('Missing svix headers', { status: 400 })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Verify the webhook
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new NextResponse('Webhook verification failed', { status: 400 })
  }

  // Handle the webhook
  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data

    // Get primary email
    const primaryEmail = email_addresses.find((email) => email.id === evt.data.primary_email_address_id)

    if (!primaryEmail) {
      console.error('No primary email found for user:', id)
      return new NextResponse('No primary email found', { status: 400 })
    }

    try {
      // Create User and Student records
      const user = await prisma.user.create({
        data: {
          clerkId: id,
          email: primaryEmail.email_address,
          emailVerified: primaryEmail.verification?.status === 'verified',
          role: 'STUDENT', // Default role as per AC#5
          student: {
            create: {
              firstName: first_name || '',
              lastName: last_name || '',
            },
          },
        },
        include: {
          student: true,
        },
      })

      console.log('User created successfully:', user.id)
      return NextResponse.json({ success: true, userId: user.id })
    } catch (error) {
      console.error('Error creating user:', error)

      // Check if user already exists (idempotency)
      const existingUser = await prisma.user.findUnique({
        where: { clerkId: id },
      })

      if (existingUser) {
        console.log('User already exists:', existingUser.id)
        return NextResponse.json({ success: true, userId: existingUser.id })
      }

      return new NextResponse('Failed to create user', { status: 500 })
    }
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data

    // Get primary email
    const primaryEmail = email_addresses.find((email) => email.id === evt.data.primary_email_address_id)

    if (!primaryEmail) {
      console.error('No primary email found for user:', id)
      return new NextResponse('No primary email found', { status: 400 })
    }

    try {
      // Update User record
      const user = await prisma.user.update({
        where: { clerkId: id },
        data: {
          email: primaryEmail.email_address,
          emailVerified: primaryEmail.verification?.status === 'verified',
          student: {
            update: {
              firstName: first_name || '',
              lastName: last_name || '',
            },
          },
        },
        include: {
          student: true,
        },
      })

      console.log('User updated successfully:', user.id)
      return NextResponse.json({ success: true, userId: user.id })
    } catch (error) {
      console.error('Error updating user:', error)
      return new NextResponse('Failed to update user', { status: 500 })
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data

    try {
      // Delete User record (cascade will handle Student and related records)
      await prisma.user.delete({
        where: { clerkId: id as string },
      })

      console.log('User deleted successfully:', id)
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Error deleting user:', error)
      return new NextResponse('Failed to delete user', { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
