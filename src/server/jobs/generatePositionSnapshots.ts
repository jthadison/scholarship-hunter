/**
 * Position Snapshot Generation Background Job
 *
 * Runs daily at midnight to create competitive position snapshots for all students.
 * Calculates percentile rankings, match counts by tier, projected funding, and awards badges.
 *
 * Story: 5.5 - Competitive Positioning Over Time (Task 2)
 * @module server/jobs/generatePositionSnapshots
 */

import { prisma } from "../db";
import { countMatchesByTier } from "@/lib/positioning/analytics";
import { checkAndAwardBadges } from "@/lib/positioning/badges";

/**
 * Process position snapshot generation for all students
 * Creates daily snapshots with percentile rankings and competitive metrics
 */
export async function processPositionSnapshots() {
  console.log("[Position Snapshots] Starting job...");

  try {
    const today = new Date();

    // Fetch all students with their profiles and matches
    const students = await prisma.student.findMany({
      select: {
        id: true,
        profile: {
          select: {
            strengthScore: true,
          },
        },
        matches: {
          select: {
            id: true,
            priorityTier: true,
            overallMatchScore: true,
            successProbability: true,
            scholarship: {
              select: {
                awardAmount: true,
              },
            },
          },
          orderBy: {
            overallMatchScore: "desc",
          },
          take: 20, // Top 20 for funding calculation
        },
      },
    });

    console.log(`[Position Snapshots] Processing ${students.length} students`);

    // Sort students by profile strength for percentile calculation
    const sortedStudents = [...students].sort(
      (a, b) =>
        (b.profile?.strengthScore ?? 0) - (a.profile?.strengthScore ?? 0)
    );

    let successCount = 0;
    let errorCount = 0;
    let badgesAwarded = 0;

    // Process each student
    for (let i = 0; i < sortedStudents.length; i++) {
      const student = sortedStudents[i];

      if (!student) continue;

      try {
        const profileStrengthScore = student.profile?.strengthScore ?? 0;

        // Calculate percentile ranking (rank-based)
        // Top student = 100th percentile, bottom = 0th percentile
        const percentileRanking =
          students.length > 1
            ? ((students.length - i) / students.length) * 100
            : 100;

        // Count matches by tier
        const tierCounts = await countMatchesByTier(student.id);
        const totalMatches =
          tierCounts.MUST_APPLY +
          tierCounts.SHOULD_APPLY +
          tierCounts.IF_TIME_PERMITS +
          tierCounts.HIGH_VALUE_REACH;

        // Calculate projected funding
        // Formula: Sum (match_score × award_amount × success_probability) for top 20 matches
        const projectedFunding = student.matches.reduce((sum, match) => {
          const matchScore = match.overallMatchScore / 100; // Normalize to 0-1
          const successProb = match.successProbability / 100; // Normalize to 0-1
          const awardAmount = match.scholarship.awardAmount;

          return sum + matchScore * awardAmount * successProb;
        }, 0);

        // Create position snapshot
        await prisma.profilePositionSnapshot.create({
          data: {
            studentId: student.id,
            snapshotDate: today,
            profileStrengthScore,
            percentileRanking: Math.round(percentileRanking * 100) / 100, // Round to 2 decimal places
            totalMatches,
            mustApplyCount: tierCounts.MUST_APPLY,
            shouldApplyCount: tierCounts.SHOULD_APPLY,
            ifTimePermitsCount: tierCounts.IF_TIME_PERMITS,
            projectedFunding: Math.round(projectedFunding),
          },
        });

        // Check for badge unlocks
        const newBadges = await checkAndAwardBadges(student.id);
        badgesAwarded += newBadges.length;

        if (newBadges.length > 0) {
          console.log(
            `[Position Snapshots] Awarded ${newBadges.length} badge(s) to student ${student.id}: ${newBadges.join(", ")}`
          );
        }

        successCount++;
      } catch (error) {
        console.error(
          `[Position Snapshots] Error processing student ${student.id}:`,
          error
        );
        errorCount++;
      }
    }

    console.log(
      `[Position Snapshots] Completed: ${successCount} success, ${errorCount} errors, ${badgesAwarded} badges awarded`
    );

    return {
      success: true,
      processed: successCount,
      errors: errorCount,
      badgesAwarded,
    };
  } catch (error) {
    console.error("[Position Snapshots] Job failed:", error);
    throw error;
  }
}

/**
 * Detect milestone achievements for a student
 * Returns array of milestone descriptions
 * (Reserved for future use)
 */
export async function detectMilestoneAchievements(studentId: string): Promise<string[]> {
  const milestones: string[] = [];

  try {
    // Get last two snapshots to detect changes
    const recentSnapshots = await prisma.profilePositionSnapshot.findMany({
      where: { studentId },
      orderBy: { snapshotDate: "desc" },
      take: 2,
    });

    if (recentSnapshots.length < 2) {
      return milestones;
    }

    const current = recentSnapshots[0];
    const previous = recentSnapshots[1];

    if (!current || !previous) {
      return milestones;
    }

    // Profile strength increase of 10+ points
    const strengthDelta = current.profileStrengthScore - previous.profileStrengthScore;
    if (strengthDelta >= 10) {
      milestones.push(`Profile strength increased by ${Math.round(strengthDelta)} points`);
    }

    // Percentile jump of 10+ percentile points
    const percentileDelta = current.percentileRanking - previous.percentileRanking;
    if (percentileDelta >= 10) {
      milestones.push(`Moved up ${Math.round(percentileDelta)} percentile points`);
    }

    // Tier upgrade (significant match count increase)
    const matchDelta = current.totalMatches - previous.totalMatches;
    if (matchDelta >= 10) {
      milestones.push(`Unlocked ${matchDelta} new scholarship matches`);
    }

    // Crossed into top 25% or top 10%
    if (previous.percentileRanking < 75 && current.percentileRanking >= 75) {
      milestones.push("Entered top 25% of students");
    }
    if (previous.percentileRanking < 90 && current.percentileRanking >= 90) {
      milestones.push("Entered top 10% of students");
    }

    return milestones;
  } catch (error) {
    console.error(`[Position Snapshots] Error detecting milestones for student ${studentId}:`, error);
    return milestones;
  }
}

/**
 * Entry point for scheduled job (e.g., cron, Inngest)
 * Can be called by: inngest.createFunction({ cron: '0 0 * * *' })
 */
export default processPositionSnapshots;
