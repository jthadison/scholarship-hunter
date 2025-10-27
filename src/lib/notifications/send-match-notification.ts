/**
 * Send Match Notification Service
 *
 * Handles sending email and in-app notifications for new scholarship matches
 *
 * @module lib/notifications/send-match-notification
 */

import { type Student, type Scholarship, type PriorityTier, type User } from '@prisma/client'
import { resend, FROM_EMAIL } from '../email/resend-client'
import { NewScholarshipAlert } from '@/emails/new-scholarship-alert'
import { prisma } from '@/server/db'
import { differenceInDays } from 'date-fns'

export interface NotificationData {
  student: Student & {
    profile: { completionPercentage: number } | null
    user: User
  }
  scholarship: Scholarship
  matchScore: number
  priorityTier: PriorityTier
}

/**
 * Send match notification via email and create in-app notification
 *
 * Respects student notification preferences:
 * - Email enabled/disabled
 * - In-app enabled/disabled
 * - Minimum match threshold
 * - Frequency (daily/weekly/never)
 *
 * @param data - Notification data including student, scholarship, and match details
 * @returns Promise<void>
 */
export async function sendMatchNotification(data: NotificationData): Promise<void> {
  const { student, scholarship, matchScore, priorityTier } = data

  // Fetch student notification preferences (create default if doesn't exist)
  const preferences = await prisma.notificationPreferences.upsert({
    where: { studentId: student.id },
    create: {
      studentId: student.id,
      frequency: 'DAILY',
      minMatchThreshold: 75.0,
      emailEnabled: true,
      inAppEnabled: true,
    },
    update: {},
  })

  // Check if match score meets minimum threshold
  if (matchScore < preferences.minMatchThreshold) {
    return
  }

  // Check if notifications are completely disabled
  if (preferences.frequency === 'NEVER') {
    return
  }

  // Create in-app notification if enabled
  if (preferences.inAppEnabled) {
    await prisma.notification.create({
      data: {
        studentId: student.id,
        scholarshipId: scholarship.id,
        matchScore,
        priorityTier,
        read: false,
      },
    })
  }

  // Send email notification if enabled
  if (preferences.emailEnabled && student.user.email) {
    const daysUntilDeadline = differenceInDays(scholarship.deadline, new Date())
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const scholarshipUrl = `${baseUrl}/scholarships/${scholarship.id}`

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: student.user.email,
        subject: `New ${priorityTier === 'MUST_APPLY' ? 'Must-Apply' : 'High-Match'} Scholarship: ${scholarship.name}`,
        react: NewScholarshipAlert({
          studentName: student.firstName,
          scholarshipName: scholarship.name,
          matchScore: Math.round(matchScore),
          awardAmount: scholarship.awardAmount,
          daysUntilDeadline,
          scholarshipUrl,
          priorityTier,
          unsubscribeUrl: `${baseUrl}/settings/notifications?unsubscribe=true`,
        }),
      })
    } catch (error) {
      // Log error but don't throw - we don't want to fail the entire job if email fails
      console.error(`Failed to send email notification to student ${student.id}:`, error)
    }
  }
}

/**
 * Batch send notifications with rate limiting
 *
 * Sends up to 100 emails per batch to comply with Resend rate limits
 *
 * @param notifications - Array of notification data
 * @param batchSize - Maximum number of emails to send per batch (default: 100)
 */
export async function batchSendNotifications(
  notifications: NotificationData[],
  batchSize = 100
): Promise<void> {
  for (let i = 0; i < notifications.length; i += batchSize) {
    const batch = notifications.slice(i, i + batchSize)
    await Promise.all(batch.map((notification) => sendMatchNotification(notification)))

    // Add small delay between batches to avoid rate limiting
    if (i + batchSize < notifications.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
}
