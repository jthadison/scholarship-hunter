/**
 * Manual Meilisearch Sync Script
 *
 * Syncs ALL scholarships from database to Meilisearch index.
 * Useful for initial setup and testing.
 */

// Load environment variables - .env.local overrides .env
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

import { prisma } from '../src/server/db'
import {
  getScholarshipsIndex,
  initializeMeilisearchIndex,
  type ScholarshipSearchDocument,
} from '../src/server/lib/search/meilisearch-client'

async function syncMeilisearch() {
  try {
    console.log('🔧 Initializing Meilisearch index...')
    await initializeMeilisearchIndex()
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
    const index = getScholarshipsIndex()
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
