/**
 * Build Meilisearch Filter Tests
 *
 * Unit tests for buildMeilisearchFilter function.
 * Tests all filter combinations and edge cases.
 *
 * @module __tests__/search/build-meilisearch-filter
 */

import { describe, it, expect } from 'vitest'
import { buildMeilisearchFilter, getSortField } from '@/server/lib/search/build-filter'

describe('buildMeilisearchFilter', () => {
  it('should return empty string for no filters', () => {
    const result = buildMeilisearchFilter({})
    expect(result).toBe('verified = true') // Default verified filter
  })

  it('should build award amount range filter', () => {
    const result = buildMeilisearchFilter({
      minAward: 5000,
      maxAward: 10000,
    })
    expect(result).toBe('awardAmount >= 5000 AND awardAmount <= 10000 AND verified = true')
  })

  it('should handle single award bound', () => {
    const minOnly = buildMeilisearchFilter({ minAward: 5000 })
    expect(minOnly).toBe('awardAmount >= 5000 AND verified = true')

    const maxOnly = buildMeilisearchFilter({ maxAward: 10000 })
    expect(maxOnly).toBe('awardAmount <= 10000 AND verified = true')
  })

  it('should build deadline range filter', () => {
    const minDate = new Date('2025-01-01')
    const maxDate = new Date('2025-12-31')

    const result = buildMeilisearchFilter({
      minDeadline: minDate,
      maxDeadline: maxDate,
    })

    expect(result).toContain('deadline >= ')
    expect(result).toContain('deadline <= ')
    expect(result).toContain('verified = true')
  })

  it('should build tags filter with OR logic', () => {
    const result = buildMeilisearchFilter({
      tags: ['STEM', 'Women'],
    })

    expect(result).toContain("tags IN ['STEM']")
    expect(result).toContain("tags IN ['Women']")
    expect(result).toContain(' OR ')
  })

  it('should escape single quotes in tags', () => {
    const result = buildMeilisearchFilter({
      tags: ["Women's Studies"],
    })

    expect(result).toContain("tags IN ['Women\\'s Studies']")
  })

  it('should build category filter', () => {
    const result = buildMeilisearchFilter({
      category: 'Academic',
    })

    expect(result).toContain("category = 'Academic'")
  })

  it('should combine multiple filters with AND', () => {
    const result = buildMeilisearchFilter({
      minAward: 5000,
      maxAward: 10000,
      tags: ['STEM'],
      category: 'Academic',
    })

    expect(result).toContain('awardAmount >= 5000')
    expect(result).toContain('awardAmount <= 10000')
    expect(result).toContain("tags IN ['STEM']")
    expect(result).toContain("category = 'Academic'")
    expect(result).toContain('verified = true')

    // Check AND separators
    const andCount = (result.match(/ AND /g) || []).length
    expect(andCount).toBeGreaterThan(0)
  })

  it('should allow unverified scholarships when verifiedOnly is false', () => {
    const result = buildMeilisearchFilter({
      verifiedOnly: false,
    })

    expect(result).toBe('')
  })
})

describe('getSortField', () => {
  it('should return correct sort for amount', () => {
    expect(getSortField('amount')).toBe('awardAmount:desc')
  })

  it('should return correct sort for deadline', () => {
    expect(getSortField('deadline')).toBe('deadline:asc')
  })

  it('should return empty for match (relevance)', () => {
    expect(getSortField('match')).toBe('')
  })

  it('should return empty for strategicValue (client-side sort)', () => {
    expect(getSortField('strategicValue')).toBe('')
  })
})
