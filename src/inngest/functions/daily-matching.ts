/**
 * Daily Scholarship Matching Background Job
 *
 * Runs daily at 6 AM to:
 * 1. Fetch students with complete profiles (≥50% completion)
 * 2. Fetch new/updated scholarships from last 24 hours
 * 3. Apply hard filtering and 4-stage matching algorithm
 * 4. Upsert Match records to database
 * 5. Send notifications for MUST_APPLY/SHOULD_APPLY tier matches
 *
 * Performance target: Process 100,000 students in <1 hour
 *
 * @module inngest/functions/daily-matching
 */

import { inngest } from '../client'
import { prisma } from '@/server/db'
import { applyHardFilters } from '@/lib/matching/hard-filter'
import { calculateMatchScore } from '@/server/lib/matching/calculate-match-score'
import { sendMatchNotification, type NotificationData } from '@/lib/notifications/send-match-notification'
import type { Student, Profile, User, Scholarship } from '@prisma/client'

/**
 * Daily scholarship matching cron job
 *
 * Schedule: 0 6 * * * (6 AM daily)
 *
 * Uses Inngest step.run() for atomic operations:
 * - Automatic retries on failure
 * - Granular observability
 * - Idempotent execution
 */
export const dailyScholarshipMatching = inngest.createFunction(
  {
    id: 'daily-scholarship-matching',
    name: 'Daily Scholarship Matching',
  },
  { cron: '0 6 * * *' }, // Daily at 6 AM
  async ({ step, logger }) => {
    logger.info('Starting daily scholarship matching job')

    // Step 1: Fetch students with complete profiles
    const students = await step.run('fetch-students', async () => {
      const result = await prisma.student.findMany({
        where: {
          profile: {
            completionPercentage: { gte: 50 },
          },
        },
        include: {
          profile: true,
          user: true,
        },
      })

      logger.info(`Fetched ${result.length} students with ≥50% profile completion`)
      return result
    })

    // Step 2: Fetch new/updated scholarships from last 24 hours
    const scholarships = await step.run('fetch-new-scholarships', async () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

      const result = await prisma.scholarship.findMany({
        where: {
          OR: [
            { createdAt: { gte: oneDayAgo } },
            { updatedAt: { gte: oneDayAgo } },
          ],
          verified: true,
          deadline: { gte: new Date() }, // Only active scholarships
        },
      })

      logger.info(`Fetched ${result.length} new/updated scholarships from last 24 hours`)
      return result
    })

    // Early exit if no new scholarships
    if (scholarships.length === 0) {
      logger.info('No new scholarships found. Skipping matching.')
      return { studentsProcessed: 0, matchesCreated: 0, notificationsSent: 0 }
    }

    // Step 3: Process students in batches for performance
    const BATCH_SIZE = 100
    let totalMatches = 0
    let totalNotifications = 0

    for (let i = 0; i < students.length; i += BATCH_SIZE) {
      const batch = students.slice(i, i + BATCH_SIZE)
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1
      const totalBatches = Math.ceil(students.length / BATCH_SIZE)

      await step.run(`process-batch-${batchNumber}`, async () => {
        logger.info(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} students)`)

        const notificationsToSend: NotificationData[] = []
        let batchEligibleCount = 0

        for (const student of batch) {
          if (!student.profile) {
            logger.warn(`Student ${student.id} has no profile, skipping`)
            continue
          }

          // Apply hard filtering to eliminate ineligible scholarships
          const eligibleScholarships = scholarships.filter((scholarship) => {
            const filterResult = applyHardFilters(
              { ...student, profile: student.profile! } as unknown as Student & { profile: Profile },
              scholarship as unknown as Scholarship
            )
            return filterResult.eligible
          })

          batchEligibleCount += eligibleScholarships.length

          logger.debug(
            `Student ${student.id}: ${eligibleScholarships.length}/${scholarships.length} scholarships passed hard filter`
          )

          // Calculate match scores for eligible scholarships
          for (const scholarship of eligibleScholarships) {
            try {
              // Calculate comprehensive match score with all metrics
              const matchScore = await calculateMatchScore(
                { ...student, profile: student.profile! } as unknown as Student & { profile: Profile },
                scholarship as unknown as Scholarship
              )

              // Upsert match record (idempotent - safe to re-run)
              await prisma.match.upsert({
                where: {
                  studentId_scholarshipId: {
                    studentId: student.id,
                    scholarshipId: scholarship.id,
                  },
                },
                create: {
                  studentId: student.id,
                  scholarshipId: scholarship.id,
                  overallMatchScore: matchScore.overallMatchScore,
                  academicScore: matchScore.academicScore,
                  demographicScore: matchScore.demographicScore,
                  majorFieldScore: matchScore.majorFieldScore,
                  experienceScore: matchScore.experienceScore,
                  financialScore: matchScore.financialScore,
                  specialCriteriaScore: matchScore.specialCriteriaScore,
                  successProbability: matchScore.successProbability,
                  successTier: matchScore.successTier,
                  competitionFactor: matchScore.competitionFactor,
                  strategicValue: matchScore.strategicValue,
                  applicationEffort: matchScore.applicationEffort,
                  effortBreakdown: matchScore.effortBreakdown as any,
                  strategicValueTier: matchScore.strategicValueTier,
                  priorityTier: matchScore.priorityTier,
                  calculatedAt: matchScore.calculatedAt,
                },
                update: {
                  overallMatchScore: matchScore.overallMatchScore,
                  academicScore: matchScore.academicScore,
                  demographicScore: matchScore.demographicScore,
                  majorFieldScore: matchScore.majorFieldScore,
                  experienceScore: matchScore.experienceScore,
                  financialScore: matchScore.financialScore,
                  specialCriteriaScore: matchScore.specialCriteriaScore,
                  successProbability: matchScore.successProbability,
                  successTier: matchScore.successTier,
                  competitionFactor: matchScore.competitionFactor,
                  strategicValue: matchScore.strategicValue,
                  applicationEffort: matchScore.applicationEffort,
                  effortBreakdown: matchScore.effortBreakdown as any,
                  strategicValueTier: matchScore.strategicValueTier,
                  priorityTier: matchScore.priorityTier,
                  calculatedAt: new Date(),
                },
              })

              totalMatches++

              // Queue notification if MUST_APPLY or SHOULD_APPLY
              if (
                matchScore.priorityTier === 'MUST_APPLY' ||
                matchScore.priorityTier === 'SHOULD_APPLY'
              ) {
                notificationsToSend.push({
                  student: {
                    ...student,
                    profile: student.profile!,
                    user: student.user,
                  } as unknown as Student & { profile: Profile; user: User },
                  scholarship: scholarship as unknown as Scholarship,
                  matchScore: matchScore.overallMatchScore,
                  priorityTier: matchScore.priorityTier,
                })
              }
            } catch (error) {
              logger.error(`Failed to calculate match for student ${student.id}, scholarship ${scholarship.id}:`, { error })
            }
          }
        }

        // Send notifications for this batch
        if (notificationsToSend.length > 0) {
          logger.info(`Sending ${notificationsToSend.length} notifications for batch ${batchNumber}`)

          for (const notification of notificationsToSend) {
            try {
              await sendMatchNotification(notification)
              totalNotifications++
            } catch (error) {
              logger.error(
                `Failed to send notification to student ${notification.student.id}:`,
                { error }
              )
            }
          }
        }

        return {
          batchStudents: batch.length,
          batchMatches: batchEligibleCount,
          batchNotifications: notificationsToSend.length,
        }
      })
    }

    // Final summary
    const summary = {
      studentsProcessed: students.length,
      scholarshipsEvaluated: scholarships.length,
      matchesCreated: totalMatches,
      notificationsSent: totalNotifications,
      completedAt: new Date().toISOString(),
    }

    logger.info('Daily matching job completed', summary)

    return summary
  }
)
