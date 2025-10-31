/**
 * Analytics Aggregation Background Job
 *
 * Runs daily at midnight to create analytics snapshots for all students.
 * Pre-computes expensive metrics for fast dashboard loading.
 *
 * Story: 5.2 - Analytics Dashboard - Success Metrics (Task 9)
 * @module server/jobs/analyticsAggregation
 */

import { prisma } from '../db'
import { calculateSuccessMetrics } from '@/lib/analytics/calculator'
import { startOfDay, endOfDay, subDays } from 'date-fns'

/**
 * Process analytics aggregation for all students
 * Creates daily snapshots of success metrics
 */
export async function processAnalyticsAggregation() {
  console.log('[Analytics Aggregation] Starting job...')

  try {
    const today = new Date()
    const periodStart = startOfDay(subDays(today, 1)) // Yesterday start
    const periodEnd = endOfDay(subDays(today, 1)) // Yesterday end

    // Fetch all students
    const students = await prisma.student.findMany({
      select: {
        id: true,
        profile: {
          select: {
            strengthScore: true,
            completionPercentage: true,
          },
        },
      },
    })

    console.log(`[Analytics Aggregation] Processing ${students.length} students`)

    let successCount = 0
    let errorCount = 0

    // Process each student
    for (const student of students) {
      try {
        // Calculate all-time metrics
        const metrics = await calculateSuccessMetrics(prisma, student.id)

        // Count activity metrics
        const matchesGenerated = await prisma.match.count({
          where: { studentId: student.id },
        })

        const essaysWritten = await prisma.essay.count({
          where: { studentId: student.id },
        })

        const documentsUploaded = await prisma.document.count({
          where: { studentId: student.id },
        })

        // Create snapshot
        await prisma.analyticsSnapshot.create({
          data: {
            studentId: student.id,
            snapshotDate: today,
            periodStart,
            periodEnd,
            // Success metrics
            totalApplications: metrics.totalApplications,
            totalSubmitted: metrics.totalSubmitted,
            totalAwarded: metrics.totalAwarded,
            totalDenied: metrics.totalDenied,
            successRate: metrics.successRate,
            // Funding metrics
            totalFundingSecured: metrics.totalFundingSecured,
            averageAwardAmount: metrics.averageAwardAmount,
            potentialFunding: 0, // To be calculated if needed
            // Profile metrics
            profileStrengthScore: student.profile?.strengthScore ?? 0,
            profileCompletion: student.profile?.completionPercentage ?? 0,
            // Activity metrics
            matchesGenerated,
            essaysWritten,
            documentsUploaded,
          },
        })

        successCount++
      } catch (error) {
        console.error(`[Analytics Aggregation] Error for student ${student.id}:`, error)
        errorCount++
      }
    }

    console.log(
      `[Analytics Aggregation] Completed. Success: ${successCount}, Errors: ${errorCount}`
    )

    return {
      success: true,
      processed: students.length,
      successful: successCount,
      errors: errorCount,
    }
  } catch (error) {
    console.error('[Analytics Aggregation] Job failed:', error)
    throw error
  }
}

/**
 * Clean up old snapshots
 * Keeps last 365 days of snapshots per student
 */
export async function cleanupOldSnapshots() {
  console.log('[Analytics Cleanup] Starting cleanup...')

  try {
    const cutoffDate = subDays(new Date(), 365)

    const result = await prisma.analyticsSnapshot.deleteMany({
      where: {
        snapshotDate: {
          lt: cutoffDate,
        },
      },
    })

    console.log(`[Analytics Cleanup] Deleted ${result.count} old snapshots`)

    return {
      success: true,
      deleted: result.count,
    }
  } catch (error) {
    console.error('[Analytics Cleanup] Cleanup failed:', error)
    throw error
  }
}
