/**
 * Story 3.4: Alert Dismiss API Route
 *
 * Handles one-click dismiss from email links
 * Verifies JWT token and permanently dismisses alert
 *
 * @module app/api/alerts/dismiss
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { verifyActionToken } from '@/server/services/email/deadline-alert'

export async function GET(request: NextRequest) {
  try {
    // Get token from query params
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Missing token parameter' },
        { status: 400 }
      )
    }

    // Verify JWT token
    const decoded = verifyActionToken(token)

    if (!decoded || decoded.action !== 'dismiss') {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Update alert to DISMISSED status
    const alert = await prisma.alert.update({
      where: { id: decoded.alertId },
      data: {
        status: 'DISMISSED',
      },
      include: {
        application: {
          include: {
            scholarship: true,
          },
        },
      },
    })

    // Redirect to application page with success message
    const redirectUrl = new URL('/applications', request.nextUrl.origin)
    redirectUrl.searchParams.set('dismissed', 'true')
    redirectUrl.searchParams.set('scholarship', alert.application.scholarship.name)

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Error dismissing alert:', error)
    return NextResponse.json(
      { error: 'Failed to dismiss alert' },
      { status: 500 }
    )
  }
}
