/**
 * Scholarship Duplicate Detection
 *
 * Provides duplicate detection functionality for scholarship imports using
 * fuzzy matching on name and provider fields.
 *
 * @module lib/scholarship-dedup
 */

import Fuse from 'fuse.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Duplicate match result
 */
export interface DuplicateMatch {
  /** The scholarship being checked */
  scholarship: {
    name: string
    provider: string
    [key: string]: unknown
  }
  /** ID of existing scholarship in database (if checkExisting=true) */
  existingId?: string
  /** Name of existing scholarship */
  existingName?: string
  /** Provider of existing scholarship */
  existingProvider?: string
  /** Similarity score (0.0 to 1.0, higher = more similar) */
  similarity: number
  /** Whether this is an exact match */
  isExact: boolean
}

/**
 * Options for duplicate detection
 */
export interface DuplicateDetectionOptions {
  /** Similarity threshold (0.0 to 1.0). Default: 0.9 (90%) */
  threshold?: number
  /** Check against existing database records. Default: true */
  checkExisting?: boolean
  /** Check within the provided array for duplicates. Default: true */
  checkWithinArray?: boolean
}

/**
 * Find duplicate scholarships using fuzzy matching
 *
 * @param scholarships - Array of scholarships to check for duplicates
 * @param options - Duplicate detection options
 * @returns Array of duplicate matches found
 */
export async function findDuplicates(
  scholarships: Array<{ name: string; provider: string; [key: string]: unknown }>,
  options: DuplicateDetectionOptions = {}
): Promise<DuplicateMatch[]> {
  const {
    threshold = 0.9,
    checkExisting = true,
    checkWithinArray = true,
  } = options

  const duplicates: DuplicateMatch[] = []
  const seenInArray = new Set<string>()

  // Check against existing database records
  if (checkExisting) {
    const existing = await prisma.scholarship.findMany({
      select: { id: true, name: true, provider: true },
    })

    // Configure Fuse.js for fuzzy matching
    const fuse = new Fuse(existing, {
      keys: [
        { name: 'name', weight: 0.7 },
        { name: 'provider', weight: 0.3 },
      ],
      threshold: 1 - threshold, // Fuse uses distance, we use similarity
      includeScore: true,
    })

    for (const scholarship of scholarships) {
      // Check for exact match first
      const exactMatch = existing.find(
        (e) =>
          e.name.toLowerCase() === scholarship.name.toLowerCase() &&
          e.provider.toLowerCase() === scholarship.provider.toLowerCase()
      )

      if (exactMatch) {
        duplicates.push({
          scholarship,
          existingId: exactMatch.id,
          existingName: exactMatch.name,
          existingProvider: exactMatch.provider,
          similarity: 1.0,
          isExact: true,
        })
        continue
      }

      // Fuzzy search
      const searchQuery = `${scholarship.name} ${scholarship.provider}`
      const results = fuse.search(searchQuery)

      if (results.length > 0 && results[0].score !== undefined) {
        const match = results[0]
        const similarity = 1 - match.score // Convert distance to similarity

        if (similarity >= threshold) {
          duplicates.push({
            scholarship,
            existingId: match.item.id,
            existingName: match.item.name,
            existingProvider: match.item.provider,
            similarity,
            isExact: false,
          })
        }
      }
    }
  }

  // Check within the array for internal duplicates
  if (checkWithinArray) {
    for (let i = 0; i < scholarships.length; i++) {
      const scholarship = scholarships[i]
      const key = `${scholarship.name.toLowerCase()}|${scholarship.provider.toLowerCase()}`

      // Skip if already marked as duplicate against existing DB
      const alreadyMarked = duplicates.some(
        (d) =>
          d.scholarship.name === scholarship.name &&
          d.scholarship.provider === scholarship.provider
      )

      if (alreadyMarked) {
        continue
      }

      // Check if we've seen this exact combination before in the array
      if (seenInArray.has(key)) {
        // Find the first occurrence
        const firstOccurrence = scholarships
          .slice(0, i)
          .find(
            (s) =>
              s.name.toLowerCase() === scholarship.name.toLowerCase() &&
              s.provider.toLowerCase() === scholarship.provider.toLowerCase()
          )

        if (firstOccurrence) {
          duplicates.push({
            scholarship,
            existingName: firstOccurrence.name,
            existingProvider: firstOccurrence.provider,
            similarity: 1.0,
            isExact: true,
          })
        }
      } else {
        seenInArray.add(key)
      }
    }
  }

  return duplicates
}

/**
 * Merge duplicate scholarship data, prioritizing most recent/complete data
 *
 * @param existing - Existing scholarship data
 * @param incoming - Incoming scholarship data
 * @returns Merged scholarship data
 */
export function mergeDuplicates(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>
): Record<string, unknown> {
  const merged = { ...existing }

  // Merge strategy: prefer incoming data if it's more complete
  for (const [key, value] of Object.entries(incoming)) {
    const existingValue = existing[key]

    // Skip if incoming value is null/undefined
    if (value === null || value === undefined) {
      continue
    }

    // Replace if existing is null/undefined
    if (existingValue === null || existingValue === undefined) {
      merged[key] = value
      continue
    }

    // For strings, prefer longer/more detailed value
    if (typeof value === 'string' && typeof existingValue === 'string') {
      merged[key] = value.length > existingValue.length ? value : existingValue
      continue
    }

    // For numbers, prefer higher value (assuming more recent/accurate)
    if (typeof value === 'number' && typeof existingValue === 'number') {
      merged[key] = Math.max(value, existingValue)
      continue
    }

    // For arrays, merge and deduplicate
    if (Array.isArray(value) && Array.isArray(existingValue)) {
      merged[key] = Array.from(new Set([...existingValue, ...value]))
      continue
    }

    // For objects, recursively merge
    if (
      typeof value === 'object' &&
      typeof existingValue === 'object' &&
      !Array.isArray(value) &&
      !Array.isArray(existingValue)
    ) {
      merged[key] = mergeDuplicates(
        existingValue as Record<string, unknown>,
        value as Record<string, unknown>
      )
      continue
    }

    // Default: prefer incoming value
    merged[key] = value
  }

  // Update lastVerified to current date when merging
  merged.lastVerified = new Date()

  return merged
}

/**
 * Check if a single scholarship is a duplicate of any existing scholarships
 *
 * @param scholarship - Scholarship to check
 * @param threshold - Similarity threshold (default: 0.9)
 * @returns Duplicate match if found, null otherwise
 */
export async function checkDuplicate(
  scholarship: { name: string; provider: string },
  threshold: number = 0.9
): Promise<DuplicateMatch | null> {
  const duplicates = await findDuplicates([scholarship], {
    threshold,
    checkExisting: true,
    checkWithinArray: false,
  })

  return duplicates.length > 0 ? duplicates[0] : null
}
