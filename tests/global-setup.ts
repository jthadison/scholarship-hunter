/**
 * Playwright Global Setup
 *
 * This file runs once before all tests to initialize the test environment.
 *
 * Key responsibilities:
 * - Configure Clerk testing environment
 * - Set up test database
 * - Initialize any global test state
 */

import { clerkSetup } from '@clerk/testing/playwright'
import dotenv from 'dotenv'
import path from 'path'

async function globalSetup() {
  // Load test environment variables
  dotenv.config({ path: path.resolve(__dirname, '../.env.test') })

  console.log('🔧 Running global setup...')

  // Initialize Clerk testing environment
  // This is REQUIRED for clerk.signIn() to work in auth-helpers.ts
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''

  // Decode the Clerk publishable key to get the Frontend API URL
  // Format: pk_test_<base64EncodedDomain>
  // The base64 part contains the actual clerk.accounts.dev domain
  let frontendApiUrl: string | undefined

  if (publishableKey.startsWith('pk_test_')) {
    // Decode the base64 encoded domain from the publishable key
    const encodedDomain = publishableKey.replace('pk_test_', '')
    try {
      const decodedDomain = Buffer.from(encodedDomain, 'base64').toString('utf-8').replace(/\$$/, '')
      frontendApiUrl = `https://${decodedDomain}`
      console.log(`📍 Decoded Clerk Frontend API URL: ${frontendApiUrl}`)
    } catch (error) {
      console.error('❌ Failed to decode Clerk publishable key:', error)
    }
  }

  await clerkSetup({
    frontendApiUrl,
  })

  console.log('✅ Clerk testing environment configured')
  console.log('✅ Global setup complete')
}

export default globalSetup
