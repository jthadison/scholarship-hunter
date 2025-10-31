/**
 * Story 5.8: Parent Email Notification Service
 *
 * Service for sending parent notification emails.
 * Handles award notifications, application submissions, and deadline digests.
 *
 * @module server/services/email/parent-notifications
 */

import { render } from '@react-email/render'
import { resend, FROM_EMAIL, validateResendConfig } from '@/lib/email/resend-client'
import ParentAwardNotificationEmail from '@/emails/ParentAwardNotificationEmail'
import { db } from '@/server/db'
import { ParentNotificationFrequency } from '@prisma/client'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/**
 * Send award notification to parent
 *
 * @param parentEmail - Parent's email address
 * @param studentName - Student's first name
 * @param scholarshipName - Name of scholarship
 * @param awardAmount - Award amount in dollars
 */
export async function sendParentAwardNotification(
  parentEmail: string,
  studentName: string,
  scholarshipName: string,
  awardAmount: number
) {
  validateResendConfig()

  const emailHtml = await render(
    ParentAwardNotificationEmail({
      parentName: 'Parent', // Could be enhanced to include actual parent name
      studentName,
      scholarshipName,
      awardAmount,
      dashboardUrl: `${BASE_URL}/parent/dashboard`,
    })
  )

  try {
    const response = await resend.emails.send({
      from: `Quinn @ Scholarship Hunter <${FROM_EMAIL}>`,
      to: [parentEmail],
      subject: `🎉 Great News! ${studentName} was awarded ${scholarshipName}`,
      html: emailHtml,
      tags: [
        { name: 'category', value: 'parent-award-notification' },
        { name: 'student', value: studentName },
      ],
    })

    return response
  } catch (error) {
    console.error('Failed to send parent award notification:', error)
    throw error
  }
}

/**
 * Trigger parent notifications when an outcome is recorded
 * This should be called from the outcome recording workflow
 *
 * @param studentId - Student ID
 * @param scholarshipName - Scholarship name
 * @param awardAmount - Award amount (if awarded)
 * @param result - Outcome result (AWARDED, DENIED, etc.)
 */
export async function triggerParentOutcomeNotifications(
  studentId: string,
  scholarshipName: string,
  awardAmount: number | null,
  result: string
) {
  // Only send notifications for awards
  if (result !== 'AWARDED' || !awardAmount) {
    return
  }

  // Find parents with access and notification preferences enabled
  const parentAccessRecords = await db.studentParentAccess.findMany({
    where: {
      studentId,
      accessGranted: true,
      revokedAt: null,
      permissions: {
        has: 'RECEIVE_NOTIFICATIONS',
      },
    },
  })

  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { firstName: true },
  })

  if (!student) {
    console.error('Student not found:', studentId)
    return
  }

  // Send notifications to each parent
  for (const access of parentAccessRecords) {
    // Check notification preferences
    const preferences = await db.parentNotificationPreferences.findUnique({
      where: {
        parentId_studentId: {
          parentId: access.parentId,
          studentId,
        },
      },
    })

    // Skip if notifications are disabled or set to OFF
    if (
      !preferences ||
      !preferences.notifyOnAward ||
      preferences.emailFrequency === ParentNotificationFrequency.OFF
    ) {
      continue
    }

    // For real-time notifications, send immediately
    // For digest notifications, this would be queued for batch processing
    if (preferences.emailFrequency === ParentNotificationFrequency.REALTIME) {
      // Get parent email
      const parent = await db.user.findUnique({
        where: { id: access.parentId },
        select: { email: true },
      })

      if (parent) {
        try {
          await sendParentAwardNotification(
            parent.email,
            student.firstName,
            scholarshipName,
            awardAmount
          )
          console.log(`Sent award notification to parent: ${parent.email}`)
        } catch (error) {
          console.error(`Failed to send notification to parent ${parent.email}:`, error)
        }
      }
    }

    // TODO: For digest notifications (DAILY_DIGEST, WEEKLY_DIGEST),
    // queue the notification for batch processing by Inngest job
  }
}

/**
 * Batch send digest emails to parents
 * This should be called by an Inngest scheduled job
 *
 * @param frequency - DAILY_DIGEST or WEEKLY_DIGEST
 */
export async function sendParentDigestEmails(frequency: ParentNotificationFrequency) {
  // TODO: Implement digest email aggregation and sending
  // 1. Query ParentNotificationPreferences WHERE emailFrequency = frequency
  // 2. For each parent, aggregate recent events (applications, awards, deadlines)
  // 3. Render digest email template
  // 4. Send batch emails with rate limiting (50 per batch, 1s delay)

  console.log(`TODO: Send parent digest emails for frequency: ${frequency}`)
}
