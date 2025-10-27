/**
 * Timeline Conflict Detection Service (Story 3.5 - Task 3)
 *
 * Detects scheduling conflicts when multiple applications have overlapping
 * intensive work periods in the same week.
 *
 * Conflict Threshold: >15 hours per week
 * - Based on research: Students can sustain 10-15 hours/week on extracurriculars
 * - Exceeding this threshold leads to burnout and quality degradation
 *
 * @see docs/tech-spec-epic-3.md#Conflict Detection
 * @see docs/stories/epic-3/story-3.5.md
 */

import { startOfWeek, getISOWeek, getYear, isSameWeek } from 'date-fns';
import type { Timeline, Scholarship } from '@prisma/client';

/**
 * Weekly workload conflict threshold (hours)
 */
export const CONFLICT_THRESHOLD_HOURS = 15;

/**
 * Application with timeline and scholarship data
 */
export interface ApplicationWithTimeline {
  id: string;
  timeline: Timeline | null;
  scholarship: Pick<Scholarship, 'name' | 'deadline'>;
}

/**
 * Weekly conflict report
 */
export interface WeeklyConflict {
  weekStart: Date;
  weekNumber: number;
  year: number;
  totalHours: number;
  applicationIds: string[];
  applicationNames: string[];
}

/**
 * Complete conflict detection report
 */
export interface ConflictReport {
  hasConflicts: boolean;
  conflictedWeeks: WeeklyConflict[];
  totalConflictedApplications: number;
}

/**
 * Weekly workload aggregation
 */
interface WeeklyWorkload {
  weekKey: string; // Format: "YYYY-WW" (ISO week)
  weekStart: Date;
  weekNumber: number;
  year: number;
  totalHours: number;
  applications: Array<{
    id: string;
    name: string;
    estimatedHours: number;
  }>;
}

/**
 * Get ISO week identifier for a date
 *
 * @param date - Date to get week for
 * @returns Week key in format "YYYY-WW"
 */
function getWeekKey(date: Date): string {
  const year = getYear(date);
  const week = getISOWeek(date);
  return `${year}-${String(week).padStart(2, '0')}`;
}

/**
 * Get all active milestone dates from a timeline
 *
 * Returns dates that represent intensive work periods:
 * - startEssayDate (beginning of essay work)
 * - requestRecsDate (coordination work for recommendations)
 * - uploadDocsDate (document preparation)
 * - finalReviewDate (review and polish)
 *
 * Note: submitDate is not included as it's a single-day task
 *
 * @param timeline - Timeline with milestone dates
 * @returns Array of active milestone dates
 */
function getActiveMilestoneDates(timeline: Timeline): Date[] {
  const dates: Date[] = [];

  if (timeline.startEssayDate) dates.push(timeline.startEssayDate);
  if (timeline.requestRecsDate) dates.push(timeline.requestRecsDate);
  if (timeline.uploadDocsDate) dates.push(timeline.uploadDocsDate);
  if (timeline.finalReviewDate) dates.push(timeline.finalReviewDate);

  return dates;
}

/**
 * Group applications by calendar week
 *
 * For each application, its estimated hours are distributed across all weeks
 * where it has active milestones.
 *
 * @param applications - Applications with timelines
 * @returns Map of week keys to weekly workload data
 */
function groupApplicationsByWeek(
  applications: ApplicationWithTimeline[]
): Map<string, WeeklyWorkload> {
  const weeklyWorkloads = new Map<string, WeeklyWorkload>();

  for (const app of applications) {
    if (!app.timeline) continue;

    const estimatedHours = app.timeline.estimatedHours || 0;
    const milestoneDates = getActiveMilestoneDates(app.timeline);

    // Get unique weeks where this application has milestones
    const weekKeys = new Set<string>();
    for (const date of milestoneDates) {
      weekKeys.add(getWeekKey(date));
    }

    // Distribute hours evenly across weeks with milestones
    const hoursPerWeek = weekKeys.size > 0 ? estimatedHours / weekKeys.size : 0;

    // Add to each week's workload
    for (const weekKey of weekKeys) {
      const milestoneDate = milestoneDates.find(
        (d) => getWeekKey(d) === weekKey
      )!;
      const weekStart = startOfWeek(milestoneDate, { weekStartsOn: 1 }); // Monday
      const weekNumber = getISOWeek(milestoneDate);
      const year = getYear(milestoneDate);

      let weekData = weeklyWorkloads.get(weekKey);
      if (!weekData) {
        weekData = {
          weekKey,
          weekStart,
          weekNumber,
          year,
          totalHours: 0,
          applications: [],
        };
        weeklyWorkloads.set(weekKey, weekData);
      }

      weekData.totalHours += hoursPerWeek;
      weekData.applications.push({
        id: app.id,
        name: app.scholarship.name,
        estimatedHours: hoursPerWeek,
      });
    }
  }

  return weeklyWorkloads;
}

/**
 * Identify weeks with workload conflicts
 *
 * A week is conflicted if total estimated hours exceed CONFLICT_THRESHOLD_HOURS (15).
 *
 * @param weeklyWorkloads - Map of weekly workloads
 * @returns Array of conflicted weeks
 */
function identifyConflictedWeeks(
  weeklyWorkloads: Map<string, WeeklyWorkload>
): WeeklyConflict[] {
  const conflicts: WeeklyConflict[] = [];

  for (const [, weekData] of weeklyWorkloads) {
    if (weekData.totalHours > CONFLICT_THRESHOLD_HOURS) {
      conflicts.push({
        weekStart: weekData.weekStart,
        weekNumber: weekData.weekNumber,
        year: weekData.year,
        totalHours: Math.round(weekData.totalHours * 10) / 10, // Round to 1 decimal
        applicationIds: weekData.applications.map((a) => a.id),
        applicationNames: weekData.applications.map((a) => a.name),
      });
    }
  }

  // Sort by date
  return conflicts.sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());
}

/**
 * Detect timeline conflicts across multiple applications
 *
 * Algorithm:
 * 1. Group applications by calendar week (ISO week number)
 * 2. For each week, sum estimatedHours across all applications with active milestones
 * 3. Flag conflict if weekly total exceeds 15 hours (sustainable workload threshold)
 * 4. Return report with conflicted weeks and affected applications
 *
 * @param applications - Applications with timelines and scholarship data
 * @returns Conflict detection report
 *
 * @example
 * ```ts
 * const report = detectTimelineConflicts(applications);
 * if (report.hasConflicts) {
 *   console.log(`Warning: ${report.conflictedWeeks.length} weeks with conflicts`);
 *   report.conflictedWeeks.forEach(week => {
 *     console.log(`Week ${week.weekNumber}: ${week.totalHours}h across ${week.applicationIds.length} apps`);
 *   });
 * }
 * ```
 */
export function detectTimelineConflicts(
  applications: ApplicationWithTimeline[]
): ConflictReport {
  // Group applications by week and calculate workload
  const weeklyWorkloads = groupApplicationsByWeek(applications);

  // Identify weeks exceeding threshold
  const conflictedWeeks = identifyConflictedWeeks(weeklyWorkloads);

  // Get unique application IDs involved in conflicts
  const conflictedAppIds = new Set<string>();
  conflictedWeeks.forEach((week) => {
    week.applicationIds.forEach((id) => conflictedAppIds.add(id));
  });

  return {
    hasConflicts: conflictedWeeks.length > 0,
    conflictedWeeks,
    totalConflictedApplications: conflictedAppIds.size,
  };
}

/**
 * Get conflicts for a specific application
 *
 * Returns list of other application IDs that conflict with the given application.
 *
 * @param applicationId - Application to check conflicts for
 * @param conflictReport - Full conflict detection report
 * @returns Array of conflicting application IDs
 */
export function getConflictsForApplication(
  applicationId: string,
  conflictReport: ConflictReport
): string[] {
  const conflictingIds = new Set<string>();

  for (const week of conflictReport.conflictedWeeks) {
    if (week.applicationIds.includes(applicationId)) {
      // Add all other applications in this conflicted week
      week.applicationIds.forEach((id) => {
        if (id !== applicationId) {
          conflictingIds.add(id);
        }
      });
    }
  }

  return Array.from(conflictingIds);
}

/**
 * Generate conflict warning message
 *
 * @param conflict - Weekly conflict data
 * @returns Human-readable warning message
 *
 * @example
 * "Warning: Nov 1-7 has 18 hours scheduled across 3 applications (App1, App2, App3)"
 */
export function generateConflictWarning(conflict: WeeklyConflict): string {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const weekStart = conflict.weekStart;
  const month = monthNames[weekStart.getMonth()];
  const day = weekStart.getDate();

  const appCount = conflict.applicationIds.length;
  const appList = conflict.applicationNames.slice(0, 3).join(', ');
  const appSuffix = conflict.applicationNames.length > 3
    ? `, +${conflict.applicationNames.length - 3} more`
    : '';

  return `Warning: ${month} ${day}-${day + 6} has ${conflict.totalHours} hours scheduled across ${appCount} applications (${appList}${appSuffix})`;
}

/**
 * Check if two applications have overlapping timeline weeks
 *
 * @param app1 - First application with timeline
 * @param app2 - Second application with timeline
 * @returns true if applications have milestones in the same week
 */
export function hasOverlappingWeeks(
  app1: ApplicationWithTimeline,
  app2: ApplicationWithTimeline
): boolean {
  if (!app1.timeline || !app2.timeline) return false;

  const dates1 = getActiveMilestoneDates(app1.timeline);
  const dates2 = getActiveMilestoneDates(app2.timeline);

  // Check if any dates fall in the same week
  for (const date1 of dates1) {
    for (const date2 of dates2) {
      if (isSameWeek(date1, date2, { weekStartsOn: 1 })) {
        return true;
      }
    }
  }

  return false;
}
