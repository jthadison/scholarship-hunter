/**
 * Story 5.10: Platform-Wide Search - Full-Text Search Setup Script
 *
 * This script sets up PostgreSQL full-text search for global platform search.
 * It adds tsvector columns, GIN indexes, and triggers to Scholarship, Application,
 * Essay, and Document tables.
 *
 * Usage: tsx scripts/setup-fulltext-search.ts
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

async function setupFullTextSearch() {
  console.log('🔧 Setting up PostgreSQL full-text search...\n')

  try {
    // Read the SQL migration file
    const sqlPath = join(__dirname, '../prisma/migrations/add_fulltext_search.sql')
    const sql = readFileSync(sqlPath, 'utf-8')

    console.log('📝 Executing SQL migration file...\n')

    // Execute the entire SQL file as one transaction
    await prisma.$executeRawUnsafe(sql)

    console.log('\n✅ Full-text search setup completed!')

    // Verify the setup
    console.log('\n🔍 Verifying setup...')

    const scholarshipCount = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM "Scholarship" WHERE search_vector IS NOT NULL`
    )
    console.log(`✅ Scholarships indexed: ${scholarshipCount[0]?.count ?? 0}`)

    const applicationCount = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM "Application" WHERE search_vector IS NOT NULL`
    )
    console.log(`✅ Applications indexed: ${applicationCount[0]?.count ?? 0}`)

    const essayCount = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM "Essay" WHERE search_vector IS NOT NULL`
    )
    console.log(`✅ Essays indexed: ${essayCount[0]?.count ?? 0}`)

    const documentCount = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM "Document" WHERE search_vector IS NOT NULL`
    )
    console.log(`✅ Documents indexed: ${documentCount[0]?.count ?? 0}`)

    console.log('\n🎉 Full-text search is ready to use!')
  } catch (error) {
    console.error('❌ Failed to set up full-text search:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

setupFullTextSearch()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
