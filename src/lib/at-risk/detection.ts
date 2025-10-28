/**
 * At-Risk Application Detection Algorithm
 * Story 3.10: AC #1
 *
 * Implements three-tier flagging system:
 * - Rule 1: Deadline <7 days AND progress <50% (WARNING)
 * - Rule 2: Deadline <3 days AND any incomplete requirements (URGENT)
 * - Rule 3: Deadline <1 day AND status not READY_FOR_REVIEW/SUBMITTED (CRITICAL)
 */

import { differenceInDays } from "date-fns";
import type { Application, Scholarship } from "@prisma/client";
import type { AtRiskReason, Severity } from "@prisma/client";

export interface AtRiskApplication extends Application {
  scholarship: Scholarship;
  atRisk: true;
  atRiskReason: AtRiskReason;
  severity: Severity;
  daysUntilDeadline: number;
}

/**
 * Calculate application progress as weighted percentage
 * Weighted formula: essays 50%, docs 30%, recs 20%
 * Story 3.10 - Subtask 1.2
 */
export function calculateProgress(app: Application): number {
  // Avoid division by zero
  const essayProgress = app.essayCount > 0
    ? (app.essayComplete / app.essayCount) * 100
    : 100;

  const docProgress = app.documentsRequired > 0
    ? (app.documentsUploaded / app.documentsRequired) * 100
    : 100;

  const recProgress = app.recsRequired > 0
    ? (app.recsReceived / app.recsRequired) * 100
    : 100;

  // Weighted average: essays 50%, docs 30%, recs 20%
  return (essayProgress * 0.5) + (docProgress * 0.3) + (recProgress * 0.2);
}

/**
 * Detect at-risk applications using three criteria
 * Story 3.10 - Subtask 1.1, 1.3, 1.4, 1.5
 */
export function detectAtRiskApplications(
  applications: Array<Application & { scholarship: Scholarship }>
): AtRiskApplication[] {
  const now = new Date();
  const atRiskApps: AtRiskApplication[] = [];

  for (const app of applications) {
    const daysUntilDeadline = differenceInDays(app.scholarship.deadline, now);

    // Skip if deadline has passed
    if (daysUntilDeadline < 0) continue;

    // Skip if already submitted or withdrawn
    if (
      app.status === "SUBMITTED" ||
      app.status === "WITHDRAWN" ||
      app.status === "AWARDED" ||
      app.status === "DENIED"
    ) {
      continue;
    }

    const progress = calculateProgress(app);

    // Rule 3: 1-day critical (highest priority check)
    // Deadline <1 day AND status NOT IN [READY_FOR_REVIEW, SUBMITTED]
    // Note: SUBMITTED already filtered out above, so only check READY_FOR_REVIEW
    if (daysUntilDeadline <= 1) {
      if (app.status !== "READY_FOR_REVIEW") {
        atRiskApps.push({
          ...app,
          atRisk: true,
          atRiskReason: "ONE_DAY_NOT_READY",
          severity: "CRITICAL",
          daysUntilDeadline,
        });
        continue; // Don't check other rules
      }
    }

    // Rule 2: 3-day urgent
    // Deadline <3 days AND any incomplete requirements
    if (daysUntilDeadline <= 3 && daysUntilDeadline > 1) {
      const hasIncomplete =
        app.essayComplete < app.essayCount ||
        app.documentsUploaded < app.documentsRequired ||
        app.recsReceived < app.recsRequired;

      if (hasIncomplete) {
        atRiskApps.push({
          ...app,
          atRisk: true,
          atRiskReason: "THREE_DAY_INCOMPLETE",
          severity: "URGENT",
          daysUntilDeadline,
        });
        continue; // Don't check Rule 1
      }
    }

    // Rule 1: 7-day warning
    // Deadline <7 days AND progress <50%
    if (daysUntilDeadline <= 7 && daysUntilDeadline > 3) {
      if (progress < 50) {
        atRiskApps.push({
          ...app,
          atRisk: true,
          atRiskReason: "SEVEN_DAY_LOW_PROGRESS",
          severity: "WARNING",
          daysUntilDeadline,
        });
      }
    }
  }

  return atRiskApps;
}

/**
 * Get human-readable message for at-risk reason
 */
export function getAtRiskMessage(
  reason: AtRiskReason,
  daysUntilDeadline: number,
  progress: number
): string {
  switch (reason) {
    case "SEVEN_DAY_LOW_PROGRESS":
      return `Deadline in ${daysUntilDeadline} days with only ${Math.round(progress)}% complete`;
    case "THREE_DAY_INCOMPLETE":
      return `Deadline in ${daysUntilDeadline} days with incomplete requirements`;
    case "ONE_DAY_NOT_READY":
      return `Deadline in ${daysUntilDeadline} day${daysUntilDeadline === 1 ? "" : "s"} - not ready for review`;
    default:
      return `At risk: ${daysUntilDeadline} days remaining`;
  }
}
