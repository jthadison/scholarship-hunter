/**
 * Story 3.4: Deadline Alert Email Service
 *
 * Service for sending deadline alert emails via Resend
 * Handles template rendering, email composition, and delivery
 *
 * @module server/services/email/deadline-alert
 */

import { Resend } from 'resend'
import { render } from '@react-email/render'
import DeadlineAlertEmail, {
  UrgencyLevel,
  type DeadlineAlertEmailProps,
} from '@/emails/DeadlineAlertEmail'
import type { Application, Scholarship, Student, User } from '@prisma/client'
import { differenceInDays } from 'date-fns'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Calculate urgency level based on days remaining
 */
export function calculateUrgencyLevel(daysRemaining: number): UrgencyLevel {
  if (daysRemaining >= 14) return 'INFO'
  if (daysRemaining >= 7) return 'WARNING'
  if (daysRemaining >= 2) return 'URGENT'
  return 'CRITICAL'
}

/**
 * Generate signed token for alert action URLs
 * In production, this should use a proper JWT library
 */
function generateActionToken(alertId: string, action: 'snooze' | 'dismiss'): string {
  // TODO: Use proper JWT signing in production
  // For now, use simple base64 encoding (NOT SECURE - replace with JWT)
  return Buffer.from(`${alertId}:${action}:${Date.now()}`).toString('base64')
}

/**
 * Send deadline alert email
 *
 * @param application Application with related scholarship and student
 * @param alertId Alert ID for generating action URLs
 * @returns Resend API response
 */
export async function sendDeadlineAlert(
  application: Application & {
    student: Student & { user: User }
    scholarship: Scholarship
  },
  alertId: string
) {
  const { student, scholarship, targetSubmitDate } = application

  // Calculate days remaining
  const daysRemaining = targetSubmitDate
    ? differenceInDays(targetSubmitDate, new Date())
    : 0

  // Determine urgency level
  const urgencyLevel = calculateUrgencyLevel(daysRemaining)

  // Generate action URLs
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const snoozeToken = generateActionToken(alertId, 'snooze')
  const dismissToken = generateActionToken(alertId, 'dismiss')

  const emailProps: DeadlineAlertEmailProps = {
    studentName: student.firstName,
    scholarshipName: scholarship.name,
    awardAmount: scholarship.awardAmount,
    daysRemaining,
    urgencyLevel,
    applicationUrl: `${baseUrl}/applications/${application.id}`,
    snoozeUrl: `${baseUrl}/api/alerts/snooze?token=${snoozeToken}`,
    dismissUrl: `${baseUrl}/api/alerts/dismiss?token=${dismissToken}`,
  }

  // Render email template
  const emailHtml = await render(DeadlineAlertEmail(emailProps))

  // Get urgency config for subject line
  const urgencyEmojis = {
    INFO: '\u2139\uFE0F',
    WARNING: '\u26A0\uFE0F',
    URGENT: '\u{1F525}',
    CRITICAL: '\u{1F6A8}',
  }

  const subject = `${urgencyEmojis[urgencyLevel]} Deadline Alert: ${scholarship.name} due in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`

  // Send email via Resend
  try {
    const response = await resend.emails.send({
      from: 'Quinn @ Scholarship Hunter <quinn@scholarshiphunter.com>',
      to: [student.user.email],
      subject,
      html: emailHtml,
      tags: [
        {
          name: 'category',
          value: 'deadline-alert',
        },
        {
          name: 'urgency',
          value: urgencyLevel.toLowerCase(),
        },
      ],
    })

    return response
  } catch (error) {
    console.error('Failed to send deadline alert email:', error)
    throw error
  }
}

/**
 * Batch send deadline alert emails
 *
 * @param alerts Array of applications with alert IDs
 * @param batchSize Number of emails to send per batch (default: 50)
 */
export async function batchSendDeadlineAlerts(
  alerts: Array<{
    alertId: string
    application: Application & {
      student: Student & { user: User }
      scholarship: Scholarship
    }
  }>,
  batchSize = 50
) {
  const results = {
    sent: 0,
    failed: 0,
    errors: [] as Array<{ alertId: string; error: unknown }>,
  }

  // Process in batches to respect rate limits
  for (let i = 0; i < alerts.length; i += batchSize) {
    const batch = alerts.slice(i, i + batchSize)

    await Promise.allSettled(
      batch.map(async ({ alertId, application }) => {
        try {
          await sendDeadlineAlert(application, alertId)
          results.sent++
        } catch (error) {
          results.failed++
          results.errors.push({ alertId, error })
        }
      })
    )

    // Wait 1 second between batches to avoid rate limiting
    if (i + batchSize < alerts.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  return results
}
