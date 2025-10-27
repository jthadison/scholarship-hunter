/**
 * Shelby Module Types
 *
 * Type definitions for Shelby dashboard components
 */

import type { Match, Scholarship } from '@prisma/client'

/**
 * Partial scholarship data returned by matching API
 */
export type PartialScholarship = Pick<
  Scholarship,
  'id' | 'name' | 'provider' | 'awardAmount' | 'awardAmountMax' | 'deadline' | 'description' | 'website'
>

/**
 * Match with partial scholarship data
 */
export type MatchWithScholarship = Match & {
  scholarship: PartialScholarship
}
