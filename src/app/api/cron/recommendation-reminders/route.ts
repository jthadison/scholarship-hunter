/**
 * Recommendation Reminders Cron Job API Route
 *
 * Triggered daily by Vercel Cron or external scheduler.
 * Sends reminder emails to recommenders 7 days before deadline.
 *
 * Story 4.4: Recommendation Letter Coordination
 * AC4: Automated reminder system
 *
 * @module app/api/cron/recommendation-reminders/route
 */

import { NextRequest, NextResponse } from 'next/server'
import { processRecommendationReminders } from '@/server/jobs/recommendationReminders'

export async function GET(request: NextRequest) {
  try {
    // Verify cron authorization
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Run the reminder job
    const result = await processRecommendationReminders()

    if (result.success) {
    // @ts-expect-error - Duplicate success property will be overwritten
      return NextResponse.json({
        success: true,
        message: 'Recommendation reminders processed successfully',
        ...result,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Support POST as well for manual triggering
export async function POST(request: NextRequest) {
  return GET(request)
}
