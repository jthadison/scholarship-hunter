/**
 * Story 5.6: Counselor Portal - At-Risk Student Detection
 *
 * Daily cron job that identifies at-risk applications and creates AtRiskEvent records
 * for counselor monitoring. Detects applications with:
 * - 7 days until deadline AND progress < 50% (WARNING severity)
 * - 3 days until deadline AND incomplete (URGENT severity)
 * - 1 day until deadline AND not ready for review (CRITICAL severity)
 *
 * @module inngest/functions/at-risk-detection
 */

import { inngest } from '../client'
import { prisma } from '@/server/db'
import { ApplicationStatus, AtRiskReason, Severity } from '@prisma/client'
import { startOfDay, addDays } from 'date-fns'

/**
 * Application statuses that are considered incomplete
 */
const INCOMPLETE_STATUSES: ApplicationStatus[] = [
  'NOT_STARTED',
  'TODO',
  'IN_PROGRESS',
]

/**
 * At-Risk detection thresholds
 */
interface RiskThreshold {
  daysUntil: number
  progressThreshold?: number
  reason: AtRiskReason
  severity: Severity
}

const RISK_THRESHOLDS: RiskThreshold[] = [
  {
    daysUntil: 1,
    reason: 'ONE_DAY_NOT_READY',
    severity: 'CRITICAL',
  },
  {
    daysUntil: 3,
    reason: 'THREE_DAY_INCOMPLETE',
    severity: 'URGENT',
  },
  {
    daysUntil: 7,
    progressThreshold: 50,
    reason: 'SEVEN_DAY_LOW_PROGRESS',
    severity: 'WARNING',
  },
]

/**
 * Daily at-risk detection job
 *
 * Runs at 9 AM UTC daily (after deadline alerts)
 * Identifies at-risk applications and creates AtRiskEvent records
 */
export const atRiskDetectionJob = inngest.createFunction(
  {
    id: 'at-risk-detection',
    name: 'Detect At-Risk Applications',
  },
  { cron: '0 9 * * *' }, // Daily at 9 AM UTC
  async ({ step }) => {
    const today = startOfDay(new Date())

    // Step 1: Detect at-risk applications
    const detectionResults = await step.run('detect-at-risk', async () => {
      const eventsCreated: { threshold: number; count: number }[] = []

      for (const threshold of RISK_THRESHOLDS) {
        const targetDate = addDays(today, threshold.daysUntil)

        // Build query conditions
        const whereCondition: any = {
          targetSubmitDate: {
            gte: startOfDay(targetDate),
            lt: startOfDay(addDays(targetDate, 1)),
          },
          status: {
            in: INCOMPLETE_STATUSES,
          },
        }

        // Add progress threshold if specified
        if (threshold.progressThreshold !== undefined) {
          whereCondition.progressPercentage = {
            lt: threshold.progressThreshold,
          }
        }

        // Find at-risk applications
        const atRiskApplications = await prisma.application.findMany({
          where: whereCondition,
          include: {
            student: true,
            scholarship: true,
            atRiskEvents: {
              where: {
                reason: threshold.reason,
                resolvedAt: null,
              },
            },
          },
        })

        // Create AtRiskEvent records for applications without existing events
        const newEvents = []
        for (const application of atRiskApplications) {
          // Skip if event already exists for this reason
          if (application.atRiskEvents.length > 0) {
            continue
          }

          const daysUntilDeadline = threshold.daysUntil

          newEvents.push({
            applicationId: application.id,
            studentId: application.studentId,
            reason: threshold.reason,
            severity: threshold.severity,
            daysUntilDeadline,
            progressAtDetection: application.progressPercentage,
          })
        }

        // Bulk create events
        if (newEvents.length > 0) {
          await prisma.atRiskEvent.createMany({
            data: newEvents,
          })
        }

        eventsCreated.push({
          threshold: threshold.daysUntil,
          count: newEvents.length,
        })
      }

      return {
        date: today.toISOString(),
        eventsCreated,
        totalEvents: eventsCreated.reduce((sum, t) => sum + t.count, 0),
      }
    })

    // Step 2: Generate counselor digest data
    const digestResults = await step.run('generate-counselor-digests', async () => {
      // Get all counselors with active permissions
      const counselors = await prisma.counselor.findMany({
        include: {
          students: {
            where: {
              status: 'ACTIVE',
            },
            include: {
              student: {
                include: {
                  atRiskEvents: {
                    where: {
                      resolvedAt: null,
                      detectedAt: {
                        gte: addDays(today, -7), // Events from last 7 days
                      },
                    },
                    include: {
                      application: {
                        include: {
                          scholarship: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })

      const digestsGenerated: {
        counselorId: string
        atRiskStudentCount: number
        criticalEvents: number
        urgentEvents: number
        warningEvents: number
      }[] = []

      for (const counselor of counselors) {
        // Get students with at-risk events
        const studentsAtRisk = counselor.students.filter(
          (perm) => perm.student.atRiskEvents.length > 0
        )

        if (studentsAtRisk.length === 0) {
          continue // No at-risk students for this counselor
        }

        // Count events by severity
        let criticalCount = 0
        let urgentCount = 0
        let warningCount = 0

        for (const perm of studentsAtRisk) {
          for (const event of perm.student.atRiskEvents) {
            if (event.severity === 'CRITICAL') criticalCount++
            else if (event.severity === 'URGENT') urgentCount++
            else if (event.severity === 'WARNING') warningCount++
          }
        }

        digestsGenerated.push({
          counselorId: counselor.id,
          atRiskStudentCount: studentsAtRisk.length,
          criticalEvents: criticalCount,
          urgentEvents: urgentCount,
          warningEvents: warningCount,
        })

        // TODO: Send weekly digest email to counselor
        // For now, we're just collecting the data
        // Email sending will be implemented in notification system (Task 2.5)
      }

      return {
        digestsGenerated: digestsGenerated.length,
        totalAtRiskStudents: digestsGenerated.reduce(
          (sum, d) => sum + d.atRiskStudentCount,
          0
        ),
        counselorDigests: digestsGenerated,
      }
    })

    // Step 3: Auto-resolve events for completed applications
    const resolvedResults = await step.run('auto-resolve-events', async () => {
      // Find applications that were at-risk but are now submitted/completed
      const completedApplications = await prisma.application.findMany({
        where: {
          status: {
            in: ['SUBMITTED', 'AWAITING_DECISION', 'AWARDED', 'DENIED'],
          },
          atRiskEvents: {
            some: {
              resolvedAt: null,
            },
          },
        },
        include: {
          atRiskEvents: {
            where: {
              resolvedAt: null,
            },
          },
        },
      })

      let resolvedCount = 0

      for (const application of completedApplications) {
        // Determine outcome based on status
        let outcome: 'SUBMITTED_ON_TIME' | 'SUBMITTED_LATE' | 'DEADLINE_EXTENDED' =
          'SUBMITTED_ON_TIME'

        if (application.actualSubmitDate && application.targetSubmitDate) {
          const submittedLate =
            application.actualSubmitDate > application.targetSubmitDate
          outcome = submittedLate ? 'SUBMITTED_LATE' : 'SUBMITTED_ON_TIME'
        }

        // Update all unresolved events for this application
        await prisma.atRiskEvent.updateMany({
          where: {
            applicationId: application.id,
            resolvedAt: null,
          },
          data: {
            resolvedAt: new Date(),
            outcome,
            resolutionNotes: `Application ${application.status.toLowerCase()}`,
          },
        })

        resolvedCount += application.atRiskEvents.length
      }

      return {
        resolvedCount,
        applicationsProcessed: completedApplications.length,
      }
    })

    return {
      success: true,
      summary: {
        date: detectionResults.date,
        eventsCreated: detectionResults.totalEvents,
        eventsByThreshold: detectionResults.eventsCreated,
        counselorDigests: digestResults.digestsGenerated,
        atRiskStudents: digestResults.totalAtRiskStudents,
        eventsResolved: resolvedResults.resolvedCount,
      },
    }
  }
)
