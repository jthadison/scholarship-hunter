/**
 * Story 1.10: Change Detection Utility
 * Detects changes between current and original profile data
 * Used for version history tracking and highlighting changed fields
 */

import type { Profile } from '@prisma/client'

export interface FieldChange {
  field: string
  oldValue: any
  newValue: any
  type: 'added' | 'modified' | 'removed'
}

export interface ChangeDetectionResult {
  changedFields: string[]
  changes: FieldChange[]
  hasChanges: boolean
}

/**
 * Deeply compares two values for equality
 * Handles primitives, arrays, and objects
 */
function deepEqual(val1: any, val2: any): boolean {
  // Handle null/undefined
  if (val1 === val2) return true
  if (val1 == null || val2 == null) return false

  // Handle arrays
  if (Array.isArray(val1) && Array.isArray(val2)) {
    if (val1.length !== val2.length) return false
    return val1.every((item, index) => deepEqual(item, val2[index]))
  }

  // Handle objects
  if (typeof val1 === 'object' && typeof val2 === 'object') {
    const keys1 = Object.keys(val1)
    const keys2 = Object.keys(val2)
    if (keys1.length !== keys2.length) return false
    return keys1.every((key) => deepEqual(val1[key], val2[key]))
  }

  return false
}

/**
 * Normalize value for comparison
 * - Treats empty strings as null
 * - Trims whitespace
 * - Converts empty arrays to null
 */
function normalizeValue(value: any): any {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed === '' ? null : trimmed
  }

  if (Array.isArray(value)) {
    return value.length === 0 ? null : value
  }

  return value
}

/**
 * Fields to exclude from change detection
 * (metadata fields that update automatically)
 */
const EXCLUDED_FIELDS = new Set([
  'id',
  'studentId',
  'createdAt',
  'updatedAt',
  'completionPercentage',
  'strengthScore',
])

/**
 * Detect changes between original and current profile
 * Returns list of changed fields with old/new values
 */
export function detectChanges(
  originalProfile: Partial<Profile>,
  currentProfile: Partial<Profile>
): ChangeDetectionResult {
  const changedFields: string[] = []
  const changes: FieldChange[] = []

  // Get all unique field names from both profiles
  const allFields = new Set([
    ...Object.keys(originalProfile),
    ...Object.keys(currentProfile),
  ])

  for (const field of allFields) {
    // Skip excluded fields
    if (EXCLUDED_FIELDS.has(field)) continue

    const oldValue = normalizeValue((originalProfile as any)[field])
    const newValue = normalizeValue((currentProfile as any)[field])

    // Skip if values are equal
    if (deepEqual(oldValue, newValue)) continue

    // Determine change type
    let type: 'added' | 'modified' | 'removed'
    if (oldValue == null && newValue != null) {
      type = 'added'
    } else if (oldValue != null && newValue == null) {
      type = 'removed'
    } else {
      type = 'modified'
    }

    changedFields.push(field)
    changes.push({
      field,
      oldValue,
      newValue,
      type,
    })
  }

  return {
    changedFields,
    changes,
    hasChanges: changedFields.length > 0,
  }
}

/**
 * Generate a human-readable summary of changes
 * Example: "Updated GPA, Added SAT score"
 */
export function generateChangeSummary(changes: FieldChange[]): string {
  if (changes.length === 0) return 'No changes'

  const summaryParts: string[] = []

  // Group by change type
  const added = changes.filter((c) => c.type === 'added')
  const modified = changes.filter((c) => c.type === 'modified')
  const removed = changes.filter((c) => c.type === 'removed')

  if (modified.length > 0) {
    const fields = modified.map((c) => formatFieldName(c.field)).join(', ')
    summaryParts.push(`Updated ${fields}`)
  }

  if (added.length > 0) {
    const fields = added.map((c) => formatFieldName(c.field)).join(', ')
    summaryParts.push(`Added ${fields}`)
  }

  if (removed.length > 0) {
    const fields = removed.map((c) => formatFieldName(c.field)).join(', ')
    summaryParts.push(`Removed ${fields}`)
  }

  return summaryParts.join('; ')
}

/**
 * Format field name for display
 * Converts camelCase to Title Case with spaces
 */
export function formatFieldName(fieldName: string): string {
  // Special cases
  const specialCases: Record<string, string> = {
    gpa: 'GPA',
    satScore: 'SAT Score',
    actScore: 'ACT Score',
    efc: 'EFC',
    pellGrantEligible: 'Pell Grant Eligibility',
    efcRange: 'EFC Range',
  }

  if (specialCases[fieldName]) {
    return specialCases[fieldName]
  }

  // Convert camelCase to Title Case
  return fieldName
    .replace(/([A-Z])/g, ' $1') // Add space before capitals
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .trim()
}

/**
 * Calculate strength score delta between two profiles
 * Returns positive/negative change in score
 */
export function calculateStrengthDelta(
  originalStrength: number,
  newStrength: number
): {
  delta: number
  direction: 'increased' | 'decreased' | 'unchanged'
  formatted: string
} {
  const delta = newStrength - originalStrength

  let direction: 'increased' | 'decreased' | 'unchanged'
  if (delta > 0) {
    direction = 'increased'
  } else if (delta < 0) {
    direction = 'decreased'
  } else {
    direction = 'unchanged'
  }

  const formatted = delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)

  return { delta, direction, formatted }
}

/**
 * Calculate completeness delta between two profiles
 * Returns positive/negative change in percentage
 */
export function calculateCompletenessDelta(
  originalCompletion: number,
  newCompletion: number
): {
  delta: number
  direction: 'increased' | 'decreased' | 'unchanged'
  formatted: string
} {
  const delta = newCompletion - originalCompletion

  let direction: 'increased' | 'decreased' | 'unchanged'
  if (delta > 0) {
    direction = 'increased'
  } else if (delta < 0) {
    direction = 'decreased'
  } else {
    direction = 'unchanged'
  }

  const formatted = delta > 0 ? `+${delta.toFixed(1)}%` : `${delta.toFixed(1)}%`

  return { delta, direction, formatted }
}
