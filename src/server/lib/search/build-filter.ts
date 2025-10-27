/**
 * Meilisearch Filter Builder
 *
 * Converts search filter objects to Meilisearch filter string syntax.
 * Supports award amount ranges, deadline ranges, tags, and category filtering.
 *
 * Meilisearch filter syntax examples:
 * - Range: awardAmount >= 5000 AND awardAmount <= 10000
 * - Array contains: tags IN ['STEM', 'Women']
 * - Date: deadline > '2025-01-01'
 * - Boolean: verified = true
 *
 * @module server/lib/search/build-filter
 */

/**
 * Search filter options
 */
export interface SearchFilters {
  /** Minimum award amount in dollars */
  minAward?: number
  /** Maximum award amount in dollars */
  maxAward?: number
  /** Minimum deadline date */
  minDeadline?: Date
  /** Maximum deadline date */
  maxDeadline?: Date
  /** Filter by tags (any of these tags) */
  tags?: string[]
  /** Filter by category */
  category?: string
  /** Only show verified scholarships */
  verifiedOnly?: boolean
}

/**
 * Build Meilisearch filter string from filter options
 *
 * Combines multiple filter criteria using AND logic.
 * Empty/undefined filters are ignored.
 *
 * @param filters - Filter options object
 * @returns Meilisearch filter string (empty string if no filters)
 *
 * @example
 * buildMeilisearchFilter({
 *   minAward: 5000,
 *   maxAward: 10000,
 *   tags: ['STEM', 'Women']
 * })
 * // Returns: "awardAmount >= 5000 AND awardAmount <= 10000 AND (tags IN ['STEM'] OR tags IN ['Women'])"
 */
export function buildMeilisearchFilter(filters: SearchFilters): string {
  const conditions: string[] = []

  // Award amount range filter
  if (filters.minAward !== undefined && filters.minAward !== null) {
    conditions.push(`awardAmount >= ${filters.minAward}`)
  }
  if (filters.maxAward !== undefined && filters.maxAward !== null) {
    conditions.push(`awardAmount <= ${filters.maxAward}`)
  }

  // Deadline range filter (convert dates to ISO strings)
  if (filters.minDeadline) {
    const isoDate = filters.minDeadline.toISOString()
    conditions.push(`deadline >= '${isoDate}'`)
  }
  if (filters.maxDeadline) {
    const isoDate = filters.maxDeadline.toISOString()
    conditions.push(`deadline <= '${isoDate}'`)
  }

  // Tags filter (OR logic - match any tag)
  if (filters.tags && filters.tags.length > 0) {
    const tagConditions = filters.tags.map((tag) => {
      // Escape single quotes in tag names
      const escapedTag = tag.replace(/'/g, "\\'")
      return `tags IN ['${escapedTag}']`
    })
    conditions.push(`(${tagConditions.join(' OR ')})`)
  }

  // Category filter
  if (filters.category) {
    const escapedCategory = filters.category.replace(/'/g, "\\'")
    conditions.push(`category = '${escapedCategory}'`)
  }

  // Verified filter (default to true if not specified)
  const verifiedOnly = filters.verifiedOnly !== false // Default to true
  if (verifiedOnly) {
    conditions.push('verified = true')
  }

  // Combine all conditions with AND
  return conditions.join(' AND ')
}

/**
 * Determine Meilisearch sort field from sort option
 *
 * @param sort - Sort option ('match', 'amount', 'deadline', 'strategicValue')
 * @returns Meilisearch sort string (e.g., 'awardAmount:desc')
 */
export function getSortField(
  sort: 'match' | 'amount' | 'deadline' | 'strategicValue'
): string {
  switch (sort) {
    case 'amount':
      return 'awardAmount:desc' // Highest to lowest
    case 'deadline':
      return 'deadline:asc' // Soonest first
    case 'strategicValue':
      // Strategic value sorting is handled client-side after enrichment
      return ''
    case 'match':
    default:
      // Match score is handled by Meilisearch's built-in relevance ranking
      // No explicit sort needed - results are already sorted by relevance
      return ''
  }
}
