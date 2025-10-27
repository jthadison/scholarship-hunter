/**
 * Meilisearch Client Configuration
 *
 * Provides singleton Meilisearch client instance and index configuration.
 * Used for fast, typo-tolerant scholarship search with <100ms response time.
 *
 * Index Configuration:
 * - Searchable attributes: name, provider, description, tags, category
 * - Filterable attributes: awardAmount, deadline, category, tags
 * - Sortable attributes: awardAmount, deadline
 *
 * @module server/lib/search/meilisearch-client
 */

import { MeiliSearch } from 'meilisearch'

// Ensure environment variables are available
if (!process.env.MEILISEARCH_HOST) {
  throw new Error('MEILISEARCH_HOST environment variable is not set')
}

if (!process.env.MEILISEARCH_API_KEY) {
  throw new Error('MEILISEARCH_API_KEY environment variable is not set')
}

/**
 * Singleton Meilisearch client instance
 */
export const meilisearch = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST,
  apiKey: process.env.MEILISEARCH_API_KEY,
})

/**
 * Scholarship search index name
 */
export const SCHOLARSHIPS_INDEX = 'scholarships'

/**
 * Initialize Meilisearch index with proper configuration
 *
 * This function should be called once during application startup to ensure
 * the scholarships index exists and is properly configured.
 *
 * Configuration:
 * - Primary key: id
 * - Searchable attributes: name, provider, description, tags, category
 * - Filterable attributes: awardAmount, deadline, category, tags
 * - Sortable attributes: awardAmount, deadline
 * - Typo tolerance: enabled (1-2 typos allowed)
 * - Ranking rules: words, typo, proximity, attribute, sort, exactness
 *
 * @returns Promise that resolves when index is configured
 */
export async function initializeMeilisearchIndex(): Promise<void> {
  try {
    // Get or create index
    const index = meilisearch.index(SCHOLARSHIPS_INDEX)

    // Configure searchable attributes (fields that can be searched)
    await index.updateSearchableAttributes([
      'name',
      'provider',
      'description',
      'tags',
      'category',
    ])

    // Configure filterable attributes (fields that can be used in filters)
    await index.updateFilterableAttributes([
      'awardAmount',
      'deadline',
      'category',
      'tags',
      'verified',
    ])

    // Configure sortable attributes (fields that can be used for sorting)
    await index.updateSortableAttributes(['awardAmount', 'deadline'])

    // Configure ranking rules for relevance
    await index.updateRankingRules([
      'words', // Number of query words matched
      'typo', // Fewer typos = higher rank
      'proximity', // Closer words = higher rank
      'attribute', // Earlier attributes = higher rank
      'sort', // Respect sort parameter
      'exactness', // Exact matches = higher rank
    ])

    // Configure typo tolerance (allow 1-2 typos for better search UX)
    await index.updateTypoTolerance({
      enabled: true,
      minWordSizeForTypos: {
        oneTypo: 4, // Allow 1 typo for words >= 4 chars
        twoTypos: 8, // Allow 2 typos for words >= 8 chars
      },
    })

    console.log('✅ Meilisearch index initialized successfully')
  } catch (error) {
    console.error('❌ Failed to initialize Meilisearch index:', error)
    throw error
  }
}

/**
 * Get the scholarships index
 *
 * @returns Meilisearch index instance for scholarships
 */
export function getScholarshipsIndex() {
  return meilisearch.index(SCHOLARSHIPS_INDEX)
}

/**
 * Scholarship document shape for Meilisearch
 *
 * This is a subset of the full Scholarship model, optimized for search.
 * Full scholarship details are fetched from Prisma after search.
 */
export interface ScholarshipSearchDocument {
  /** Scholarship ID (primary key) */
  id: string
  /** Scholarship name (searchable) */
  name: string
  /** Provider/organization name (searchable) */
  provider: string
  /** Description text (searchable) */
  description: string | null
  /** Award amount in dollars (filterable, sortable) */
  awardAmount: number | null
  /** Application deadline ISO string (filterable, sortable) */
  deadline: string | null
  /** Category/type (searchable, filterable) */
  category: string | null
  /** Tags array (searchable, filterable) */
  tags: string[]
  /** Whether scholarship is verified (filterable) */
  verified: boolean
}
