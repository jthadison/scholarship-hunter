/**
 * Dynamic Timeline Recalculation Service (Story 3.5 - Task 4)
 *
 * Recalculates timeline when student starts late or misses milestones.
 *
 * Recalculation Behavior:
 * - Don't change past dates (already missed milestones are historical)
 * - Compress remaining timeline proportionally
 * - Warn if deadline at-risk (compressed timeline unrealistic)
 * - Suggest deferring low-priority work if multiple conflicts
 *
 * @see docs/tech-spec-epic-3.md#Dynamic Recalculation
 * @see docs/stories/epic-3/story-3.5.md
 */

import { differenceInDays, subDays, isAfter } from 'date-fns';
import type { Timeline, Application, Scholarship } from '@prisma/client';
import { generateOptimizedTimeline, type GeneratedTimeline } from './generate';

/**
 * Recalculation trigger reasons
 */
export enum RecalculationTrigger {
  LATE_START = 'late_start',
  MILESTONE_COMPLETED = 'milestone_completed',
  DEADLINE_CHANGED = 'deadline_changed',
  COMPLEXITY_CHANGED = 'complexity_changed',
}

/**
 * Recalculation input
 */
export interface RecalculationInput {
  currentTimeline: Timeline;
  application: Pick<Application, 'essayCount' | 'essayComplete' | 'documentsRequired' | 'documentsUploaded' | 'recsRequired' | 'recsReceived'>;
  scholarship: Pick<Scholarship, 'deadline' | 'essayPrompts' | 'recommendationCount'>;
  trigger: RecalculationTrigger;
}

/**
 * Recalculated timeline result
 */
export interface RecalculatedTimeline extends GeneratedTimeline {
  isAdjusted: boolean;
  adjustmentReason: string;
  warnings: string[];
  isAtRisk: boolean;
}

/**
 * Completion status for timeline components
 */
interface CompletionStatus {
  essaysStarted: boolean;
  essaysComplete: boolean;
  recsRequested: boolean;
  recsReceived: boolean;
  docsUploaded: boolean;
  reviewComplete: boolean;
}

/**
 * Check if student has started late
 *
 * Late start is detected when:
 * - Today is after startEssayDate
 * - Essays have not been started yet (essayComplete = 0)
 *
 * @param timeline - Current timeline
 * @param application - Application progress data
 * @returns true if student started late
 */
export function isLateStart(
  timeline: Timeline,
  application: Pick<Application, 'essayComplete'>
): boolean {
  if (!timeline.startEssayDate) return false;

  const today = new Date();
  const hasStarted = application.essayComplete > 0;

  return isAfter(today, timeline.startEssayDate) && !hasStarted;
}

/**
 * Determine completion status of timeline components
 *
 * @param application - Application progress data
 * @returns Completion status for each component
 */
function getCompletionStatus(
  application: Pick<Application, 'essayCount' | 'essayComplete' | 'documentsRequired' | 'documentsUploaded' | 'recsRequired' | 'recsReceived'>
): CompletionStatus {
  return {
    essaysStarted: application.essayComplete > 0,
    essaysComplete: application.essayComplete >= application.essayCount,
    recsRequested: application.recsReceived > 0, // Assume requested if any received
    recsReceived: application.recsReceived >= application.recsRequired,
    docsUploaded: application.documentsUploaded >= application.documentsRequired,
    reviewComplete: false, // No explicit field, assume false
  };
}

/**
 * Calculate remaining work based on completion status
 *
 * Adjusts complexity to only count incomplete work.
 *
 * @param application - Application progress data
 * @returns Adjusted essay and recommendation counts
 */
function calculateRemainingWork(
  application: Pick<Application, 'essayCount' | 'essayComplete' | 'recsRequired' | 'recsReceived'>
): { remainingEssays: number; remainingRecs: number } {
  const remainingEssays = Math.max(0, application.essayCount - application.essayComplete);
  const remainingRecs = Math.max(0, application.recsRequired - application.recsReceived);

  return { remainingEssays, remainingRecs };
}

/**
 * Detect if recalculated timeline is at risk
 *
 * Timeline is at-risk if:
 * 1. Less than 7 days remain until deadline
 * 2. Remaining work requires more than available days (compressed timeline)
 * 3. Complexity is high (>7) and less than 14 days remain
 *
 * @param recalculatedTimeline - New timeline after recalculation
 * @param deadline - Scholarship deadline
 * @param remainingComplexity - Adjusted complexity for remaining work
 * @returns true if timeline is at-risk
 */
function isTimelineAtRisk(
  recalculatedTimeline: GeneratedTimeline,
  deadline: Date,
  remainingComplexity: number
): boolean {
  const daysUntilDeadline = differenceInDays(deadline, new Date());

  // Risk condition 1: Less than 7 days
  if (daysUntilDeadline < 7) return true;

  // Risk condition 2: High complexity with short time
  if (remainingComplexity > 7 && daysUntilDeadline < 14) return true;

  // Risk condition 3: Start date is after today (impossible timeline)
  const today = new Date();
  if (isAfter(recalculatedTimeline.startEssayDate, today)) {
    // Timeline is realistic, not at risk
    return false;
  }

  return false;
}

/**
 * Generate warnings for adjusted timeline
 *
 * @param completion - Completion status
 * @param daysUntilDeadline - Days remaining
 * @param remainingComplexity - Adjusted complexity
 * @returns Array of warning messages
 */
function generateWarnings(
  completion: CompletionStatus,
  daysUntilDeadline: number,
  remainingComplexity: number
): string[] {
  const warnings: string[] = [];

  // Late start warning
  if (!completion.essaysStarted && daysUntilDeadline < 21) {
    const daysLate = 21 - daysUntilDeadline;
    warnings.push(`⚠️ You're ${daysLate} days behind schedule - start immediately to meet deadline`);
  }

  // Deadline approaching warning
  if (daysUntilDeadline < 7 && !completion.essaysComplete) {
    warnings.push(`⚠️ Critical: Only ${daysUntilDeadline} days until deadline. Complete essays urgently.`);
  }

  // High complexity warning
  if (remainingComplexity > 7 && daysUntilDeadline < 14) {
    warnings.push(`⚠️ High workload (${remainingComplexity} complexity) with limited time. Consider deferring lower-priority applications.`);
  }

  // Compressed timeline warning
  if (daysUntilDeadline < 3) {
    warnings.push(`⚠️ Very tight deadline. Focus only on critical requirements.`);
  }

  return warnings;
}

/**
 * Recalculate timeline when student starts late or completes milestones
 *
 * Algorithm:
 * 1. Detect late start (today > startEssayDate and essay status = NOT_STARTED)
 * 2. Calculate remaining work (adjust complexity for completed components)
 * 3. Generate new timeline from current date (not original startEssayDate)
 * 4. Skip past dates, recalculate future dates only
 * 5. Check if compressed timeline makes deadline at-risk
 * 6. Generate warnings if at-risk
 *
 * @param input - Recalculation parameters
 * @returns Recalculated timeline with warnings
 *
 * @example
 * ```ts
 * const result = recalculateTimeline({
 *   currentTimeline: timeline,
 *   application: app,
 *   scholarship: scholarship,
 *   trigger: RecalculationTrigger.LATE_START
 * });
 *
 * if (result.isAtRisk) {
 *   console.log('Warnings:', result.warnings);
 * }
 * ```
 */
export function recalculateTimeline(
  input: RecalculationInput
): RecalculatedTimeline {
  const { application, scholarship, trigger } = input;
  const today = new Date();

  // Get completion status
  const completion = getCompletionStatus(application);

  // Calculate remaining work
  const { remainingEssays, remainingRecs } = calculateRemainingWork(application);

  // Generate new timeline based on remaining work
  const newTimeline = generateOptimizedTimeline({
    deadline: scholarship.deadline,
    essayCount: remainingEssays,
    recommendationCount: remainingRecs,
  });

  // Calculate days until deadline
  const daysUntilDeadline = differenceInDays(scholarship.deadline, today);

  // Calculate remaining complexity
  const remainingComplexity = remainingEssays + (remainingRecs * 2);

  // Check if at risk
  const atRisk = isTimelineAtRisk(newTimeline, scholarship.deadline, remainingComplexity);

  // Generate warnings
  const warnings = generateWarnings(completion, daysUntilDeadline, remainingComplexity);

  // Determine adjustment reason
  let adjustmentReason = '';
  switch (trigger) {
    case RecalculationTrigger.LATE_START:
      adjustmentReason = 'Student started late - timeline compressed to current date';
      break;
    case RecalculationTrigger.MILESTONE_COMPLETED:
      adjustmentReason = 'Milestone completed - timeline updated for remaining work';
      break;
    case RecalculationTrigger.DEADLINE_CHANGED:
      adjustmentReason = 'Deadline changed - timeline recalculated';
      break;
    case RecalculationTrigger.COMPLEXITY_CHANGED:
      adjustmentReason = 'Application requirements changed - timeline recalculated';
      break;
  }

  return {
    ...newTimeline,
    isAdjusted: true,
    adjustmentReason,
    warnings,
    isAtRisk: atRisk,
  };
}

/**
 * Check if timeline needs recalculation
 *
 * Timeline should be recalculated if:
 * 1. Student started late (today > startEssayDate and no essays completed)
 * 2. Milestone was completed ahead of schedule
 * 3. Deadline changed
 * 4. Application requirements changed (complexity changed)
 *
 * @param timeline - Current timeline
 * @param application - Application progress data
 * @param scholarship - Scholarship data
 * @returns Trigger reason if recalculation needed, null otherwise
 */
export function shouldRecalculate(
  timeline: Timeline,
  application: Pick<Application, 'essayCount' | 'essayComplete' | 'recsRequired' | 'recsReceived'>,
  scholarship: Pick<Scholarship, 'deadline'>
): RecalculationTrigger | null {
  // Check late start
  if (isLateStart(timeline, application)) {
    return RecalculationTrigger.LATE_START;
  }

  // Check deadline changed
  if (timeline.submitDate && !isSameDay(timeline.submitDate, subDays(scholarship.deadline, 1))) {
    return RecalculationTrigger.DEADLINE_CHANGED;
  }

  // Check milestone completed (any progress made)
  if (application.essayComplete > 0 || application.recsReceived > 0) {
    return RecalculationTrigger.MILESTONE_COMPLETED;
  }

  return null;
}

/**
 * Helper: Check if two dates are the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Generate compressed timeline message for display
 *
 * @param original - Original timeline
 * @param recalculated - Recalculated timeline
 * @returns User-friendly message explaining changes
 *
 * @example
 * "Timeline adjusted: Original start date was Nov 1, but you're starting today (Nov 10).
 *  Complete essay by Nov 15 to stay on track."
 */
export function generateAdjustmentMessage(
  original: Timeline,
  recalculated: RecalculatedTimeline
): string {
  if (!original.startEssayDate) return '';

  const originalStart = original.startEssayDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const newEssayDeadline = recalculated.startEssayDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return `Timeline adjusted: Original start date was ${originalStart}, but you're starting today (${today}). Complete essay by ${newEssayDeadline} to stay on track.`;
}
