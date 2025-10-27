/**
 * Timeline Generation Service (Story 3.5 - Task 2)
 *
 * Implements backward planning methodology to generate optimized application timelines.
 *
 * Algorithm:
 * 1. Start from deadline (immutable constraint)
 * 2. Work backward calculating optimal dates for each milestone
 * 3. Factor in complexity (essays, recommendations)
 * 4. Calculate estimated workload hours
 *
 * @see docs/tech-spec-epic-3.md#Timeline Algorithm
 * @see docs/stories/epic-3/story-3.5.md
 */

import { subDays, differenceInDays } from 'date-fns';
import type { Scholarship } from '@prisma/client';

/**
 * Timeline generation input
 */
export interface TimelineGenerationInput {
  deadline: Date;
  essayCount: number;
  recommendationCount: number;
}

/**
 * Generated timeline with milestone dates
 */
export interface GeneratedTimeline {
  startEssayDate: Date;
  requestRecsDate: Date;
  uploadDocsDate: Date;
  finalReviewDate: Date;
  submitDate: Date;
  estimatedHours: number;
  hasConflicts: boolean;
  conflictsWith: string[];
}

/**
 * Calculate complexity score based on essay and recommendation requirements
 *
 * Formula: complexity = essayCount + (recCount × 2)
 *
 * Recommendations are weighted 2× because:
 * - Essays are student-controlled (synchronous)
 * - Recommendations depend on teacher availability (asynchronous)
 * - Recommendations require coordination overhead
 *
 * @param essayCount - Number of required essays
 * @param recCount - Number of required recommendation letters
 * @returns Complexity score (higher = more work)
 */
export function calculateComplexity(essayCount: number, recCount: number): number {
  return essayCount + (recCount * 2);
}

/**
 * Calculate estimated hours based on complexity
 *
 * Formula: estimatedHours = complexity × 2.5
 *
 * Research-based estimate: 2.5 hours per complexity point
 *
 * @param complexity - Complexity score
 * @returns Estimated total hours
 */
export function calculateEstimatedHours(complexity: number): number {
  return complexity * 2.5;
}

/**
 * Generate optimized timeline using backward planning methodology
 *
 * Milestone Calculations:
 * - Submit: deadline - 1 day (buffer for technical issues)
 * - Final Review: deadline - 3 days (time for fresh-eyes review)
 * - Upload Docs: deadline - 7 days (time to request transcripts, scan documents)
 * - Request Recs: deadline - max(14, recCount × 7) days (minimum 2 weeks, +1 week per rec)
 * - Start Essay: deadline - max(14, complexity × 3) days (3 days per complexity point, minimum 2 weeks)
 *
 * @param input - Timeline generation parameters (deadline, essay count, recommendation count)
 * @returns Generated timeline with all milestone dates and estimated hours
 *
 * @example
 * ```ts
 * const timeline = generateOptimizedTimeline({
 *   deadline: new Date('2025-12-15'),
 *   essayCount: 2,
 *   recommendationCount: 1
 * });
 * // Returns: { startEssayDate, requestRecsDate, ..., estimatedHours: 10 }
 * ```
 */
export function generateOptimizedTimeline(
  input: TimelineGenerationInput
): GeneratedTimeline {
  const { deadline, essayCount, recommendationCount } = input;

  // Calculate complexity score
  const complexity = calculateComplexity(essayCount, recommendationCount);

  // Calculate estimated hours
  const estimatedHours = calculateEstimatedHours(complexity);

  // Milestone 1: Submit date (deadline - 1 day buffer)
  const submitDate = subDays(deadline, 1);

  // Milestone 2: Final review (deadline - 3 days)
  const finalReviewDate = subDays(deadline, 3);

  // Milestone 3: Upload documents (deadline - 7 days)
  const uploadDocsDate = subDays(deadline, 7);

  // Milestone 4: Request recommendations (deadline - max(14, recCount × 7) days)
  const recLeadTime = Math.max(14, recommendationCount * 7);
  const requestRecsDate = subDays(deadline, recLeadTime);

  // Milestone 5: Start essay (deadline - max(14, complexity × 3) days)
  const essayLeadTime = Math.max(14, complexity * 3);
  const startEssayDate = subDays(deadline, essayLeadTime);

  return {
    startEssayDate,
    requestRecsDate,
    uploadDocsDate,
    finalReviewDate,
    submitDate,
    estimatedHours,
    hasConflicts: false, // Will be set by conflict detection (Task 3)
    conflictsWith: [], // Will be populated by conflict detection (Task 3)
  };
}

/**
 * Validate deadline is in the future
 *
 * @param deadline - Deadline date to validate
 * @throws Error if deadline is in the past
 */
export function validateDeadline(deadline: Date): void {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day

  if (deadline < today) {
    throw new Error('Deadline cannot be in the past');
  }
}

/**
 * Calculate days until deadline
 *
 * @param deadline - Target deadline
 * @returns Number of days remaining (can be negative if past deadline)
 */
export function getDaysUntilDeadline(deadline: Date): number {
  const today = new Date();
  return differenceInDays(deadline, today);
}

/**
 * Check if deadline is too close to generate realistic timeline
 *
 * If deadline is <7 days away, timeline milestones will be compressed
 * and may not be realistic for quality work.
 *
 * @param deadline - Target deadline
 * @returns true if deadline is <7 days away
 */
export function isDeadlineTooClose(deadline: Date): boolean {
  return getDaysUntilDeadline(deadline) < 7;
}

/**
 * Extract timeline generation parameters from scholarship
 *
 * @param scholarship - Scholarship data
 * @returns Timeline generation input
 */
export function extractTimelineInputFromScholarship(
  scholarship: Pick<Scholarship, 'deadline' | 'essayPrompts' | 'recommendationCount'>
): TimelineGenerationInput {
  // Count essays from essayPrompts JSON array
  let essayCount = 0;
  if (scholarship.essayPrompts) {
    const prompts = scholarship.essayPrompts as unknown[];
    essayCount = Array.isArray(prompts) ? prompts.length : 0;
  }

  return {
    deadline: scholarship.deadline,
    essayCount,
    recommendationCount: scholarship.recommendationCount,
  };
}
