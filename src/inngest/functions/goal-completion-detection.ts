/**
 * Story 5.4: Profile Improvement Tracker - Background Job
 *
 * Daily cron job that detects goal completions and triggers celebrations.
 * - Checks goals with IN_PROGRESS status where currentValue >= targetValue
 * - Updates goal status to COMPLETED
 * - Creates ProfileGoalMilestone record
 * - (Future) Triggers email notification
 * - (Future) Recalculates profile strength
 *
 * @module inngest/functions/goal-completion-detection
 */

import { inngest } from '../client'
import { prisma } from '@/server/db'
import { GoalStatus } from '@prisma/client'

/**
 * Daily goal completion detection job
 *
 * Runs at 2 AM UTC daily
 * Checks all in-progress goals and completes those that reached their target
 */
export const goalCompletionDetectionJob = inngest.createFunction(
  {
    id: 'goal-completion-detection',
    name: 'Detect Goal Completions',
  },
  { cron: '0 2 * * *' }, // Daily at 2 AM UTC
  async ({ step, logger }) => {
    // Step 1: Fetch in-progress goals
    const inProgressGoals = await step.run('fetch-in-progress-goals', async () => {
      logger.info('Fetching in-progress goals...')

      return await prisma.profileGoal.findMany({
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
    })

    logger.info(`Found ${inProgressGoals.length} in-progress goals`)

    // Step 2: Process each goal
    const results = {
      completed: 0,
      skipped: 0,
      errors: 0,
    }

    for (const goal of inProgressGoals) {
      try {
        await step.run(`process-goal-${goal.id}`, async () => {
          // Check if goal is completed
          if (goal.currentValue < goal.targetValue) {
            logger.debug(`Goal ${goal.id}: Not yet completed (${goal.currentValue}/${goal.targetValue})`)
            results.skipped++
            return
          }

          // Check if already processed (idempotency)
          if (goal.milestones.length > 0) {
            logger.debug(`Goal ${goal.id}: Already has completion milestone, skipping`)
            results.skipped++
            return
          }

          logger.info(`Goal ${goal.id}: Completing goal for student ${goal.studentId}`)

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

          logger.info(
            `Goal ${goal.id} completed. Profile strength: ${currentProfileStrength} → ${newProfileStrength} (+${goal.impactEstimate})`
          )

          results.completed++

          // TODO: Future enhancements
          // 1. Send email notification to student
          // 2. Create in-app notification
          // 3. Recalculate actual profile strength using Story 1.7 algorithm
          // 4. Refresh scholarship matches
        })
      } catch (error) {
        logger.error(`Error processing goal ${goal.id}:`, { error })
        results.errors++
      }
    }

    // Step 3: Return summary
    return await step.run('summary', async () => {
      logger.info('Goal completion detection completed', {
        totalProcessed: inProgressGoals.length,
        completed: results.completed,
        skipped: results.skipped,
        errors: results.errors,
      })

      return {
        success: true,
        totalProcessed: inProgressGoals.length,
        completed: results.completed,
        skipped: results.skipped,
        errors: results.errors,
      }
    })
  }
)
