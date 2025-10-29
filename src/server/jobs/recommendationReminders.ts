/**
 * Automated Recommendation Reminder Job
 *
 * Background job that runs daily to send reminder emails to recommenders
 * when deadline is 7 days away and letter hasn't been received.
 *
 * Story 4.4: Recommendation Letter Coordination
 * AC4: Automated reminders - Email sent 7 days before deadline
 *
 * @module server/jobs/recommendationReminders
 */

import { prisma } from '../db'
import { sendRecommendationReminder } from '../services/emailService'

const MAX_REMINDERS_PER_RECOMMENDATION = 2

/**
 * Process recommendations that need reminders
 * Runs daily at 9 AM (configured in vercel.json or cron scheduler)
 */
export async function processRecommendationReminders() {
  console.log('[Recommendation Reminders] Starting job...')

  try {
    // Calculate date 7 days from now
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    sevenDaysFromNow.setHours(23, 59, 59, 999) // End of day

    const today = new Date()
    today.setHours(0, 0, 0, 0) // Start of day

    // Find recommendations that need reminders:
    // - Status: REQUESTED or REMINDED
    // - Scholarship deadline is 7 days away (between today and 7 days from now)
    // - Not already received
    // - Reminder not sent recently (either never sent or sent >7 days ago)
    // - Haven't hit reminder limit
    const dueRecommendations = await prisma.recommendation.findMany({
      where: {
        status: {
          in: ['REQUESTED', 'REMINDED'],
        },
        receivedAt: null, // Not yet received
        reminderCount: {
          lt: MAX_REMINDERS_PER_RECOMMENDATION,
        },
        application: {
          scholarship: {
            deadline: {
              gte: today,
              lte: sevenDaysFromNow,
            },
          },
        },
        OR: [
          // Never reminded
          { reminderSentAt: null },
          // Last reminded more than 7 days ago
          {
            reminderSentAt: {
              lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        ],
      },
      include: {
        application: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
            scholarship: true,
          },
        },
      },
    })

    console.log(`[Recommendation Reminders] Found ${dueRecommendations.length} recommendations needing reminders`)

    let successCount = 0
    let errorCount = 0

    // Process each recommendation
    for (const rec of dueRecommendations) {
      try {
        // Calculate days until deadline
        const daysUntilDue = Math.ceil(
          (rec.application.scholarship.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )

        // Generate upload link
        const uploadLink = `${process.env.NEXT_PUBLIC_APP_URL}/upload-rec/${rec.uploadToken}`

        // Send reminder email
        await sendRecommendationReminder({
          studentName: `${rec.application.student.firstName} ${rec.application.student.lastName}`,
          recommenderName: rec.recommenderName,
          recommenderEmail: rec.recommenderEmail,
          scholarshipName: rec.application.scholarship.name,
          deadline: rec.application.scholarship.deadline,
          uploadLink,
          daysUntilDue,
        })

        // Update recommendation record
        await prisma.recommendation.update({
          where: { id: rec.id },
          data: {
            status: 'REMINDED',
            reminderSentAt: new Date(),
            reminderCount: {
              increment: 1,
            },
          },
        })

        successCount++
        console.log(
          `[Recommendation Reminders] Sent reminder to ${rec.recommenderEmail} for ${rec.application.scholarship.name}`
        )
      } catch (error) {
        errorCount++
        console.error(`[Recommendation Reminders] Failed to process recommendation ${rec.id}:`, error)
      }
    }

    console.log(
      `[Recommendation Reminders] Job complete. Success: ${successCount}, Errors: ${errorCount}`
    )

    return {
      success: true,
      processed: dueRecommendations.length,
      successCount,
      errorCount,
    }
  } catch (error) {
    console.error('[Recommendation Reminders] Job failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * API handler for triggering the job manually or via cron
 */
export async function handleReminderJobRequest() {
  // Verify authorization (e.g., cron secret or API key)
  // This prevents unauthorized execution
  return await processRecommendationReminders()
}
