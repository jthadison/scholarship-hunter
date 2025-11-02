/**
 * Cloud Meilisearch Sync Script
 *
 * Syncs ALL scholarships from database to cloud Meilisearch index.
 * This script creates its own Meilisearch client after loading environment variables
 * to ensure it uses the correct configuration.
 */

// Load environment variables FIRST - .env.local overrides .env
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load .env first
dotenv.config({ path: path.resolve(process.cwd(), '.env') })
// Then override with .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true })

console.log('Environment check:')
console.log('  MEILISEARCH_HOST:', process.env.MEILISEARCH_HOST)
console.log('  MEILISEARCH_API_KEY:', process.env.MEILISEARCH_API_KEY ? '***' + process.env.MEILISEARCH_API_KEY.slice(-4) : 'NOT SET')
console.log('')

// NOW import MeiliSearch and create client with loaded environment variables
import { MeiliSearch } from 'meilisearch'
import { prisma } from '../src/server/db'

// Create Meilisearch client with environment variables
const meilisearch = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST!,
  apiKey: process.env.MEILISEARCH_API_KEY!,
})

const SCHOLARSHIPS_INDEX = 'scholarships'

interface ScholarshipSearchDocument {
  id: string
  name: string
  provider: string
  description: string | null
  awardAmount: number | null
  deadline: string | null
  category: string | null
  tags: string[]
  verified: boolean
}

async function initializeIndex() {
  const index = meilisearch.index(SCHOLARSHIPS_INDEX)

  console.log('🔧 Configuring index settings...')

  // Configure searchable attributes
  await index.updateSearchableAttributes([
    'name',
    'provider',
    'description',
    'tags',
    'category',
  ])

  // Configure filterable attributes
  await index.updateFilterableAttributes([
    'awardAmount',
    'deadline',
    'category',
    'tags',
    'verified',
  ])

  // Configure sortable attributes
  await index.updateSortableAttributes(['awardAmount', 'deadline'])

  // Configure ranking rules
  await index.updateRankingRules([
    'words',
    'typo',
    'proximity',
    'attribute',
    'sort',
    'exactness',
  ])

  // Configure typo tolerance
  await index.updateTypoTolerance({
    enabled: true,
    minWordSizeForTypos: {
      oneTypo: 4,
      twoTypos: 8,
    },
  })

  console.log('✅ Index configured successfully')
}

async function syncMeilisearch() {
  try {
    console.log('🔧 Initializing Meilisearch index...')
    await initializeIndex()
    console.log('✅ Index initialized\n')

    console.log('📥 Fetching scholarships from database...')
    const scholarships = await prisma.scholarship.findMany({
      select: {
        id: true,
        name: true,
        provider: true,
        description: true,
        awardAmount: true,
        deadline: true,
        category: true,
        tags: true,
        verified: true,
      },
    })

    console.log(`✅ Found ${scholarships.length} scholarships\n`)

    if (scholarships.length === 0) {
      console.log('⚠️  No scholarships to sync')
      return
    }

    console.log('🔄 Transforming and uploading to Meilisearch...')

    // Transform to Meilisearch format
    const documents: ScholarshipSearchDocument[] = scholarships.map((s) => ({
      id: s.id,
      name: s.name,
      provider: s.provider,
      description: s.description,
      awardAmount: s.awardAmount,
      deadline: s.deadline ? s.deadline.toISOString() : null,
      category: s.category,
      tags: (s.tags as string[]) || [],
      verified: s.verified,
    }))

    // Upload to Meilisearch
    const index = meilisearch.index(SCHOLARSHIPS_INDEX)
    const task = await index.addDocuments(documents, {
      primaryKey: 'id',
    })

    console.log(`✅ Uploaded ${documents.length} documents to Meilisearch`)
    console.log(`   Task UID: ${task.taskUid}`)
    console.log('\n🎉 Sync complete!')

    // Get index stats
    console.log('\n📊 Index Stats:')
    const stats = await index.getStats()
    console.log(`   Total documents: ${stats.numberOfDocuments}`)
    console.log(`   Indexing: ${stats.isIndexing ? 'in progress' : 'complete'}`)

  } catch (error) {
    console.error('❌ Error syncing to Meilisearch:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

syncMeilisearch()
