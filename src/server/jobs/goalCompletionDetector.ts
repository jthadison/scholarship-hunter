/**
 * Goal Completion Detector Background Job
 *
 * Runs daily to detect goal completions and trigger celebrations.
 * - Checks goals with IN_PROGRESS status where currentValue >= targetValue
 * - Updates goal status to COMPLETED
 * - Creates ProfileGoalMilestone record
 * - Triggers email notification (future enhancement)
 * - Recalculates profile strength (future enhancement)
 *
 * Story: 5.4 - Profile Improvement Tracker (Task 6)
 * @module server/jobs/goalCompletionDetector
 */

import { prisma } from '../db'
import { GoalStatus } from '@prisma/client'

/**
 * Process goal completion detection for all in-progress goals
 * Creates milestones for newly completed goals
 */
export async function processGoalCompletionDetection() {
  console.log('[Goal Completion Detector] Starting job...')

  try {
    // Fetch all goals that are in progress
    const inProgressGoals = await prisma.profileGoal.findMany({
      where: {
        status: GoalStatus.IN_PROGRESS,
      },
      include: {
        student: {
          include: {
            profile: {
              select: {
                strengthScore: true,
              },
            },
          },
        },
        milestones: {
          where: {
            description: 'Goal Completed',
          },
          take: 1, // Check if completion milestone already exists
        },
      },
    })

    console.log(`[Goal Completion Detector] Checking ${inProgressGoals.length} in-progress goals`)

    let completedCount = 0
    let errorCount = 0

    // Process each goal
    for (const goal of inProgressGoals) {
      try {
        // Check if goal is completed
        if (goal.currentValue >= goal.targetValue) {
          // Avoid processing same completion twice (idempotency)
          if (goal.milestones.length > 0) {
            console.log(
              `[Goal Completion Detector] Goal ${goal.id} already has completion milestone, skipping`
            )
            continue
          }

          console.log(`[Goal Completion Detector] Completing goal ${goal.id} for student ${goal.studentId}`)

          const currentProfileStrength = goal.student.profile?.strengthScore || 0
          const newProfileStrength = currentProfileStrength + goal.impactEstimate

          // Update goal status
          await prisma.profileGoal.update({
            where: { id: goal.id },
            data: {
              status: GoalStatus.COMPLETED,
            },
          })

          // Create completion milestone
          await prisma.profileGoalMilestone.create({
            data: {
              profileGoalId: goal.id,
              description: 'Goal Completed',
              profileStrengthBefore: currentProfileStrength,
              profileStrengthAfter: newProfileStrength,
            },
          })

          // TODO: Future enhancements
          // 1. Send email notification to student
          // 2. Trigger in-app notification
          // 3. Recalculate actual profile strength using Story 1.7 algorithm
          // 4. Refresh scholarship matches

          completedCount++

          console.log(
            `[Goal Completion Detector] Goal ${goal.id} completed. ` +
            `Profile strength: ${currentProfileStrength} → ${newProfileStrength} (+${goal.impactEstimate})`
          )
        }
      } catch (error) {
        errorCount++
        console.error(
          `[Goal Completion Detector] Error processing goal ${goal.id}:`,
          error
        )
      }
    }

    console.log(
      `[Goal Completion Detector] Job completed. ` +
      `Completed: ${completedCount}, Errors: ${errorCount}`
    )

    return {
      success: true,
      completedCount,
      errorCount,
      totalProcessed: inProgressGoals.length,
    }
  } catch (error) {
    console.error('[Goal Completion Detector] Fatal error:', error)
    throw error
  }
}

/**
 * Inngest function configuration (if using Inngest)
 * Uncomment and configure when integrating with Inngest scheduler
 */

/*
import { inngest } from '@/server/inngest/client'

export const goalCompletionDetector = inngest.createFunction(
  {
    id: 'goal-completion-detector',
    name: 'Goal Completion Detector',
  },
  { cron: '0 2 * * *' }, // Daily at 2 AM UTC
  async ({ step }) => {
    return await step.run('detect-goal-completions', async () => {
      return await processGoalCompletionDetection()
    })
  }
)
*/
