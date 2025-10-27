/**
 * Story 3.4: Deadline Alert System - Background Job
 *
 * Daily cron job that checks application deadlines and creates alert records
 * for upcoming deadlines at 6 thresholds: 30, 14, 7, 3, 1 day, and day-of.
 *
 * @module inngest/functions/deadline-alerts
 */

import { inngest } from '../client'
import { prisma } from '@/server/db'
import { AlertType, ApplicationStatus } from '@prisma/client'
import { startOfDay, addDays } from 'date-fns'

/**
 * Alert thresholds in days before deadline
 * Maps threshold to AlertType enum
 */
const ALERT_THRESHOLDS = {
  30: 'DEADLINE_30D' as AlertType,
  14: 'DEADLINE_14D' as AlertType,
  7: 'DEADLINE_7D' as AlertType,
  3: 'DEADLINE_3D' as AlertType,
  1: 'DEADLINE_1D' as AlertType,
  0: 'DEADLINE_TODAY' as AlertType,
}

/**
 * Application statuses that are considered incomplete
 * Alerts are only sent for these statuses
 */
const INCOMPLETE_STATUSES: ApplicationStatus[] = [
  'NOT_STARTED',
  'TODO',
  'IN_PROGRESS',
]

/**
 * Daily deadline alerts job
 *
 * Runs at 8 AM UTC daily
 * Checks all applications and creates alerts for upcoming deadlines
 */
export const deadlineAlertsJob = inngest.createFunction(
  {
    id: 'deadline-alerts',
    name: 'Check Application Deadlines',
  },
  { cron: '0 8 * * *' }, // Daily at 8 AM UTC
  async ({ step }) => {
    const today = startOfDay(new Date())

    // Step 1: Calculate threshold dates and query applications
    const results = await step.run('check-deadlines', async () => {
      const alertsCreated: { threshold: number; count: number }[] = []

      // Check each threshold
      for (const [daysBeforeStr, alertType] of Object.entries(
        ALERT_THRESHOLDS
      )) {
        const daysBeforeDeadline = parseInt(daysBeforeStr, 10)
        const targetDate = addDays(today, daysBeforeDeadline)

        // Find applications where targetSubmitDate matches this threshold
        const applicationsAtThreshold = await prisma.application.findMany({
          where: {
            targetSubmitDate: {
              gte: startOfDay(targetDate),
              lt: startOfDay(addDays(targetDate, 1)),
            },
            status: {
              in: INCOMPLETE_STATUSES,
            },
          },
          include: {
            student: true,
            scholarship: true,
            alerts: {
              where: {
                alertType,
              },
            },
          },
        })

        // Create alerts for applications that don't have one yet
        const newAlerts = []
        for (const application of applicationsAtThreshold) {
          // Skip if alert already exists for this threshold
          if (application.alerts.length > 0) {
            continue
          }

          // Create new alert
          newAlerts.push({
            applicationId: application.id,
            studentId: application.studentId,
            alertType,
            status: 'PENDING' as const,
          })
        }

        // Bulk create alerts
        if (newAlerts.length > 0) {
          await prisma.alert.createMany({
            data: newAlerts,
          })
        }

        alertsCreated.push({
          threshold: daysBeforeDeadline,
          count: newAlerts.length,
        })
      }

      return {
        date: today.toISOString(),
        alertsCreated,
        totalAlerts: alertsCreated.reduce((sum, t) => sum + t.count, 0),
      }
    })

    // Step 2: Send emails for pending alerts (in batches of 50)
    const emailResults = await step.run('send-alert-emails', async () => {
      // Import email service (dynamic to avoid circular deps)
      const { batchSendDeadlineAlerts } = await import(
        '@/server/services/email/deadline-alert'
      )

      // Get all pending alerts
      const pendingAlerts = await prisma.alert.findMany({
        where: {
          status: 'PENDING',
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
        take: 50, // Process first 50 alerts
      })

      if (pendingAlerts.length === 0) {
        return {
          emailsSent: 0,
          emailsFailed: 0,
        }
      }

      // Send emails via Resend
      const emailBatch = pendingAlerts.map((alert) => ({
        alertId: alert.id,
        application: alert.application,
      }))

      const sendResults = await batchSendDeadlineAlerts(emailBatch, 50)

      // Update successfully sent alerts
      const sentAlertIds = pendingAlerts
        .slice(0, sendResults.sent)
        .map((a) => a.id)

      if (sentAlertIds.length > 0) {
        await prisma.alert.updateMany({
          where: {
            id: {
              in: sentAlertIds,
            },
          },
          data: {
            status: 'SENT',
            sentAt: new Date(),
          },
        })
      }

      return {
        emailsSent: sendResults.sent,
        emailsFailed: sendResults.failed,
      }
    })

    return {
      success: true,
      summary: {
        date: results.date,
        alertsCreated: results.totalAlerts,
        alertsByThreshold: results.alertsCreated,
        emailsSent: emailResults.emailsSent,
      },
    }
  }
)
