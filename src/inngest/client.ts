/**
 * Inngest Client
 *
 * Singleton Inngest client instance for background job orchestration.
 * Used for scheduled tasks like Meilisearch sync, match recalculation, etc.
 *
 * @module inngest/client
 */

import { Inngest } from 'inngest'

/**
 * Inngest client instance
 *
 * Event driven background job system with:
 * - Scheduled/cron jobs
 * - Event-triggered workflows
 * - Automatic retries
 * - Step-based execution
 */
export const inngest = new Inngest({
  id: 'scholarship-hunter',
  name: 'Scholarship Hunter',
})
