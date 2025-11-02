/**
 * Recovery Recommendation Engine
 * Story 3.10: AC #4
 *
 * Generates specific, actionable recovery recommendations
 * for at-risk applications based on gaps and deadlines
 */

import { differenceInHours, subHours, format } from "date-fns";
import type { Application, Scholarship } from "@prisma/client";

export type RecommendationType = "ESSAY" | "DOCUMENT" | "RECOMMENDATION";
export type BlockerLevel = "HIGH" | "MEDIUM" | "LOW";

export interface RecoveryRecommendation {
  priority: number; // 1 = highest
  type: RecommendationType;
  message: string;
  blockerLevel: BlockerLevel;
  estimatedHours: number;
  deadline?: Date;
}

/**
 * Generate recovery plan with prioritized recommendations
 * Story 3.10 - Subtask 4.1, 4.2, 4.3, 4.5, 4.6
 */
export function generateRecoveryPlan(
  app: Application & { scholarship: Scholarship }
): RecoveryRecommendation[] {
  const recommendations: RecoveryRecommendation[] = [];

  // Essay recommendations (Priority 1 - highest)
  // Subtask 4.3: If essay incomplete
  if (app.essayComplete < app.essayCount) {
    const essaysRemaining = app.essayCount - app.essayComplete;
    const hoursPerEssay = 3; // Average essay writing time
    const totalEssayHours = essaysRemaining * hoursPerEssay;

    // Calculate suggested essay completion deadline
    // Leave 24 hours buffer before scholarship deadline
    const essayDeadline = subHours(app.scholarship.deadline, totalEssayHours + 24);

    recommendations.push({
      priority: 1,
      type: "ESSAY",
      message: `Complete ${essaysRemaining} essay${essaysRemaining > 1 ? "s" : ""} by ${format(essayDeadline, "EEEE h:mm a")}`,
      blockerLevel: "HIGH",
      estimatedHours: totalEssayHours,
      deadline: essayDeadline,
    });
  }

  // Document recommendations (Priority 2)
  // Subtask 4.3: If docs missing
  if (app.documentsUploaded < app.documentsRequired) {
    const docsRemaining = app.documentsRequired - app.documentsUploaded;

    recommendations.push({
      priority: 2,
      type: "DOCUMENT",
      message: `Upload ${docsRemaining} remaining document${docsRemaining > 1 ? "s" : ""} as soon as possible`,
      blockerLevel: "MEDIUM",
      estimatedHours: 0.5, // Assuming docs are already prepared
    });
  }

  // Recommendation letter follow-ups (Priority 3)
  // Subtask 4.3: If recs pending
  if (app.recsReceived < app.recsRequired) {
    const recsRemaining = app.recsRequired - app.recsReceived;

    recommendations.push({
      priority: 3,
      type: "RECOMMENDATION",
      message: `Follow up with ${recsRemaining} recommender${recsRemaining > 1 ? "s" : ""} immediately`,
      blockerLevel: "HIGH", // High because outside student's control
      estimatedHours: 0, // No direct time investment, but urgent
    });
  }

  // Subtask 4.6: Sort by priority (already done via priority values)
  return recommendations.sort((a, b) => a.priority - b.priority);
}

/**
 * Calculate required work pace
 * Story 3.10 - Subtask 4.2
 */
export function calculateRequiredPace(
  app: Application & { scholarship: Scholarship }
): {
  hoursRemaining: number;
  hoursNeeded: number;
  feasible: boolean;
  paceDescription: string;
} {
  const hoursRemaining = Math.max(0, Math.floor(differenceInHours(app.scholarship.deadline, new Date())));

  // Calculate hours needed based on incomplete work
  const essaysRemaining = app.essayCount - app.essayComplete;
  const docsRemaining = app.documentsRequired - app.documentsUploaded;

  const hoursNeeded =
    essaysRemaining * 3 + // 3 hours per essay
    docsRemaining * 0.5; // 30 minutes per document

  const feasible = hoursNeeded <= hoursRemaining;

  let paceDescription: string;
  if (hoursNeeded === 0) {
    paceDescription = "All work completed";
  } else if (!feasible) {
    paceDescription = `Critical: ${hoursNeeded} hours needed but only ${hoursRemaining} hours remaining`;
  } else if (hoursRemaining < 24) {
    paceDescription = `Urgent: Complete all work within ${hoursRemaining} hours`;
  } else {
    const hoursPerDay = hoursNeeded / (hoursRemaining / 24);
    paceDescription = `Work at ${hoursPerDay.toFixed(1)} hours per day to stay on track`;
  }

  return {
    hoursRemaining,
    hoursNeeded,
    feasible,
    paceDescription,
  };
}

/**
 * Get urgency-specific message for Quinn intervention
 * Story 3.10 - Subtask 5.5
 */
export function getQuinnMessage(daysUntilDeadline: number, severity: "WARNING" | "URGENT" | "CRITICAL"): string {
  if (severity === "CRITICAL") {
    return "⚠️ This application needs immediate attention! The deadline is in less than 24 hours. Can I help you prioritize what to complete first?";
  } else if (severity === "URGENT") {
    return `⚠️ This application is at risk with only ${daysUntilDeadline} days remaining. Let's create an action plan to get you back on track.`;
  } else {
    return `This application has ${daysUntilDeadline} days until deadline but is behind schedule. Let's review your timeline to ensure timely completion.`;
  }
}
