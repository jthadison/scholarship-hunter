/**
 * Inngest API Route
 *
 * Serves Inngest background functions via HTTP endpoint.
 * Required for Inngest to communicate with your application.
 *
 * @module pages/api/inngest
 */

import { serve } from 'inngest/next'
import { inngest } from '@/inngest/client'
import { meilisearchSync, meilisearchSyncManual } from '@/inngest/functions/meilisearch-sync'
import { dailyScholarshipMatching } from '@/inngest/functions/daily-matching'

/**
 * Inngest handler
 *
 * Registers all Inngest functions and serves them via Next.js API route.
 * Inngest will call this endpoint to execute scheduled and event-driven functions.
 */
const handler = serve({
  client: inngest,
  functions: [
    meilisearchSync, // Hourly cron sync
    meilisearchSyncManual, // Manual sync trigger
    dailyScholarshipMatching, // Daily scholarship matching at 6 AM
  ],
})

export { handler as GET, handler as POST, handler as PUT }
