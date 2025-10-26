/**
 * Financial Dimension Filter
 *
 * Filters scholarships based on financial need criteria: financial need level,
 * EFC (Expected Family Contribution), Pell Grant eligibility.
 *
 * @module lib/matching/filters/financial
 */

import type { Profile, FinancialNeed } from '@prisma/client'
import type { FinancialCriteria } from '@/types/scholarship'
import type { HardFilterResult, FailedCriterion } from '../hard-filter'
import { FilterDimension } from '../hard-filter'

/**
 * Parse EFC range string and extract maximum value
 *
 * EFC range format: "0-5000", "5001-10000", etc.
 *
 * @param efcRange - EFC range string
 * @returns Maximum EFC value in the range
 */
function parseEFCMax(efcRange: string | null | undefined): number | null {
  if (!efcRange) return null

  // Handle formats like "0-5000", "10000+"
  if (efcRange.includes('-')) {
    const parts = efcRange.split('-')
    const max = parts[1] ? parseInt(parts[1], 10) : null
    return max !== null && !isNaN(max) ? max : null
  }

  if (efcRange.includes('+')) {
    // "10000+" means effectively unlimited, return a high number
    return 999999
  }

  // Single number
  const value = parseInt(efcRange, 10)
  return isNaN(value) ? null : value
}

/**
 * Map financial need enum to priority order
 *
 * @param need - Financial need enum value
 * @returns Priority value (higher = more need)
 */
function getFinancialNeedPriority(need: FinancialNeed | null | undefined): number {
  const priorityMap: Record<FinancialNeed, number> = {
    LOW: 1,
    MODERATE: 2,
    HIGH: 3,
    VERY_HIGH: 4,
  }

  return need ? priorityMap[need] : 0
}

/**
 * Apply financial dimension filter
 *
 * Checks student's financial profile against scholarship requirements:
 * - Financial need requirement (must have need)
 * - Maximum EFC (student's EFC must not exceed limit)
 * - Pell Grant requirement (must be eligible)
 * - Financial need level (must meet or exceed required level)
 *
 * @param profile - Student profile with financial data
 * @param criteria - Financial eligibility criteria from scholarship
 * @returns HardFilterResult with pass/fail and failure details
 */
export function filterFinancial(
  profile: Profile,
  criteria: FinancialCriteria | undefined
): HardFilterResult {
  // If no criteria specified, pass by default
  if (!criteria) {
    return { eligible: true, failedCriteria: [] }
  }

  const failedCriteria: FailedCriterion[] = []

  // Check if financial need is required
  if (criteria.requiresFinancialNeed === true) {
    // Consider LOW financial need as insufficient for "requires financial need"
    if (!profile.financialNeed || profile.financialNeed === 'LOW') {
      failedCriteria.push({
        dimension: FilterDimension.FINANCIAL,
        criterion: 'requiresFinancialNeed',
        required: true,
        actual: profile.financialNeed || null,
      })
    }
  }

  // Check maximum EFC
  if (criteria.maxEFC !== undefined) {
    const studentEFCMax = parseEFCMax(profile.efcRange)

    if (studentEFCMax === null) {
      // Missing EFC data
      failedCriteria.push({
        dimension: FilterDimension.FINANCIAL,
        criterion: 'maxEFC',
        required: criteria.maxEFC,
        actual: null,
      })
    } else if (studentEFCMax > criteria.maxEFC) {
      failedCriteria.push({
        dimension: FilterDimension.FINANCIAL,
        criterion: 'maxEFC',
        required: criteria.maxEFC,
        actual: studentEFCMax,
      })
    }
  }

  // Check Pell Grant requirement
  if (criteria.pellGrantRequired === true) {
    if (!profile.pellGrantEligible) {
      failedCriteria.push({
        dimension: FilterDimension.FINANCIAL,
        criterion: 'pellGrantRequired',
        required: true,
        actual: false,
      })
    }
  }

  // Check financial need level requirement
  if (criteria.financialNeedLevel) {
    const requiredPriority = getFinancialNeedPriority(criteria.financialNeedLevel as FinancialNeed)
    const studentPriority = getFinancialNeedPriority(profile.financialNeed)

    if (studentPriority < requiredPriority) {
      failedCriteria.push({
        dimension: FilterDimension.FINANCIAL,
        criterion: 'financialNeedLevel',
        required: criteria.financialNeedLevel,
        actual: profile.financialNeed || null,
      })
    }
  }

  return {
    eligible: failedCriteria.length === 0,
    failedCriteria,
  }
}
