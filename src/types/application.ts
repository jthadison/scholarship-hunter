import type { Application, Timeline, Student, Scholarship, ApplicationStatus, PriorityTier } from "@prisma/client";

/**
 * Application TypeScript Types
 * Helper types for working with application data
 */

// Application with all relations
export type ApplicationWithRelations = Application & {
  student: Student;
  scholarship: Scholarship;
  timeline: Timeline | null;
};

// Application with selected relations (for dashboard)
export type ApplicationWithScholarship = Application & {
  scholarship: Scholarship;
  timeline: Timeline | null;
};

// Application progress data
export type ApplicationProgress = {
  essayCount: number;
  essayComplete: number;
  documentsRequired: number;
  documentsUploaded: number;
  recsRequired: number;
  recsReceived: number;
  progressPercentage: number;
};

// Calculate progress percentage from application data
export function calculateProgressPercentage(data: ApplicationProgress): number {
  const totalRequired = data.essayCount + data.documentsRequired + data.recsRequired;

  // Edge case: 0/0 = 0%
  if (totalRequired === 0) {
    return 0;
  }

  const totalComplete = data.essayComplete + data.documentsUploaded + data.recsReceived;
  return Math.round((totalComplete / totalRequired) * 100);
}

// Check if application is complete (ready to mark as READY_FOR_REVIEW)
export function isApplicationComplete(data: ApplicationProgress): boolean {
  return (
    data.essayComplete >= data.essayCount &&
    data.documentsUploaded >= data.documentsRequired &&
    data.recsReceived >= data.recsRequired
  );
}

// Days until deadline
export function getDaysUntilDeadline(deadline: Date): number {
  const now = new Date();
  const diffTime = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Check if application is at risk (deadline approaching with low progress)
export function isApplicationAtRisk(
  deadline: Date,
  progressPercentage: number,
  status: ApplicationStatus
): boolean {
  // Only check if not yet submitted
  if (["SUBMITTED", "AWAITING_DECISION", "AWARDED", "DENIED", "WITHDRAWN"].includes(status)) {
    return false;
  }

  const daysUntil = getDaysUntilDeadline(deadline);

  // At-risk criteria (from Story 3.10)
  // 1. 7 days out with <50% progress
  if (daysUntil <= 7 && progressPercentage < 50) return true;

  // 2. 3 days out and not complete
  if (daysUntil <= 3 && progressPercentage < 100) return true;

  // 3. 1 day out and not READY_FOR_REVIEW
  if (daysUntil <= 1 && status !== "READY_FOR_REVIEW") return true;

  return false;
}

// Status badge color mapping
export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  NOT_STARTED: "blue",
  TODO: "blue",
  IN_PROGRESS: "yellow",
  READY_FOR_REVIEW: "purple",
  SUBMITTED: "green",
  AWAITING_DECISION: "green",
  AWARDED: "emerald",
  DENIED: "gray",
  WITHDRAWN: "gray",
};

// Priority tier display names
export const PRIORITY_TIER_LABELS: Record<PriorityTier, string> = {
  MUST_APPLY: "Must Apply",
  SHOULD_APPLY: "Should Apply",
  IF_TIME_PERMITS: "If Time Permits",
  HIGH_VALUE_REACH: "High Value Reach",
};

// Valid status transitions (from validation schema)
export const STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  NOT_STARTED: ["TODO", "WITHDRAWN"],
  TODO: ["IN_PROGRESS", "NOT_STARTED", "WITHDRAWN"],
  IN_PROGRESS: ["READY_FOR_REVIEW", "TODO", "WITHDRAWN"],
  READY_FOR_REVIEW: ["SUBMITTED", "IN_PROGRESS", "WITHDRAWN"],
  SUBMITTED: ["AWAITING_DECISION", "WITHDRAWN"],
  AWAITING_DECISION: ["AWARDED", "DENIED", "WITHDRAWN"],
  AWARDED: [], // Terminal state
  DENIED: [], // Terminal state
  WITHDRAWN: [], // Terminal state
};

// Check if status transition is valid
export function isValidStatusTransition(
  currentStatus: ApplicationStatus,
  newStatus: ApplicationStatus
): boolean {
  return STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}
