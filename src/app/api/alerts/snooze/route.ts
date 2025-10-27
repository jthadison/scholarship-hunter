/**
 * Story 3.4: Alert Snooze API Route
 *
 * Handles one-click snooze from email links
 * Verifies JWT token and snoozes alert for 24 hours
 *
 * @module app/api/alerts/snooze
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { verifyActionToken } from '@/server/services/email/deadline-alert'
import { addHours } from 'date-fns'

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

    if (!decoded || decoded.action !== 'snooze') {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Update alert to SNOOZED status
    const alert = await prisma.alert.update({
      where: { id: decoded.alertId },
      data: {
        status: 'SNOOZED',
        snoozeUntil: addHours(new Date(), 24),
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
    redirectUrl.searchParams.set('snoozed', 'true')
    redirectUrl.searchParams.set('scholarship', alert.application.scholarship.name)

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Error snoozing alert:', error)
    return NextResponse.json(
      { error: 'Failed to snooze alert' },
      { status: 500 }
    )
  }
}
