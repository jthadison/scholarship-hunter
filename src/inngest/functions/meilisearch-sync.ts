/**
 * Meilisearch Sync Background Job
 *
 * Hourly cron job that syncs verified scholarships from Prisma database
 * to Meilisearch search index. Ensures search index stays fresh.
 *
 * Schedule: Runs every hour (0 * * * *)
 * Data Source: Prisma Scholarship table (verified = true)
 * Destination: Meilisearch scholarships index
 *
 * @module inngest/functions/meilisearch-sync
 */

import { inngest } from '../client'
import { prisma } from '@/server/db'
import {
  getScholarshipsIndex,
  type ScholarshipSearchDocument,
} from '@/server/lib/search/meilisearch-client'

/**
 * Meilisearch sync function
 *
 * Fetches all verified scholarships from database and uploads to Meilisearch.
 * Uses batch upload for efficiency. Handles errors with retry logic.
 *
 * Steps:
 * 1. Fetch verified scholarships from Prisma
 * 2. Transform to Meilisearch document format
 * 3. Batch upload to Meilisearch index
 * 4. Log sync stats
 */
export const meilisearchSync = inngest.createFunction(
  {
    id: 'meilisearch-sync',
    name: 'Sync Scholarships to Meilisearch',
    // Retry up to 3 times with exponential backoff
    retries: 3,
  },
  // Run hourly (at minute 0 of every hour)
  { cron: '0 * * * *' },
  async ({ step, logger }) => {
    // Step 1: Fetch verified scholarships from database
    const scholarships = await step.run('fetch-scholarships', async () => {
      logger.info('Fetching verified scholarships from database...')

      const scholarships = await prisma.scholarship.findMany({
        where: { verified: true },
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

      logger.info(`Fetched ${scholarships.length} verified scholarships`)
      return scholarships
    })

    // Step 2: Transform and sync to Meilisearch
    const result = await step.run('sync-to-meilisearch', async () => {
      logger.info('Transforming and uploading to Meilisearch...')

      // Transform Prisma records to Meilisearch documents
      const documents: ScholarshipSearchDocument[] = scholarships.map((s) => ({
        id: s.id,
        name: s.name,
        provider: s.provider,
        description: s.description,
        awardAmount: s.awardAmount,
        // Convert deadline Date to ISO string for Meilisearch
        deadline: s.deadline ? (s.deadline as unknown as Date).toISOString() : null,
        category: s.category,
        tags: s.tags as string[], // Prisma Json type -> string[]
        verified: s.verified,
      }))

      // Upload to Meilisearch in batch
      const index = getScholarshipsIndex()
      const task = await index.addDocuments(documents, {
        primaryKey: 'id',
      })

      logger.info(`Uploaded ${documents.length} documents to Meilisearch`)
      logger.info(`Meilisearch task UID: ${task.taskUid}`)

      // Meilisearch indexes asynchronously - task continues in background
      logger.info('Meilisearch indexing started (async)')

      return {
        scholarshipsCount: scholarships.length,
        documentsUploaded: documents.length,
        taskUid: task.taskUid,
      }
    })

    return result
  }
)

/**
 * Manual trigger for Meilisearch sync
 *
 * Allows immediate sync without waiting for hourly cron.
 * Useful after bulk scholarship imports or updates.
 */
export const meilisearchSyncManual = inngest.createFunction(
  {
    id: 'meilisearch-sync-manual',
    name: 'Manual Meilisearch Sync',
    retries: 3,
  },
  // Triggered by sending 'scholarships/sync.requested' event
  { event: 'scholarships/sync.requested' },
  async ({ step, logger }) => {
    logger.info('Manual Meilisearch sync triggered')

    // Reuse the same sync logic as cron job
    const scholarships = await step.run('fetch-scholarships', async () => {
      const scholarships = await prisma.scholarship.findMany({
        where: { verified: true },
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

      logger.info(`Fetched ${scholarships.length} verified scholarships`)
      return scholarships
    })

    const result = await step.run('sync-to-meilisearch', async () => {
      const documents: ScholarshipSearchDocument[] = scholarships.map((s) => ({
        id: s.id,
        name: s.name,
        provider: s.provider,
        description: s.description,
        awardAmount: s.awardAmount,
        deadline: s.deadline ? (s.deadline as unknown as Date).toISOString() : null,
        category: s.category,
        tags: s.tags as string[],
        verified: s.verified,
      }))

      const index = getScholarshipsIndex()
      const task = await index.addDocuments(documents, {
        primaryKey: 'id',
      })

      logger.info(`Manual sync complete: ${documents.length} documents uploaded`)

      return {
        scholarshipsCount: scholarships.length,
        documentsUploaded: documents.length,
        taskUid: task.taskUid,
      }
    })

    return result
  }
)
