/**
 * Resend Email Client
 *
 * Singleton Resend client for transactional email delivery
 *
 * @module lib/email/resend-client
 */

import { Resend } from 'resend'

// Allow missing API key during build time, but validate at runtime
const apiKey = process.env.RESEND_API_KEY || 'build-time-placeholder'

/**
 * Resend client instance for sending transactional emails
 * Note: Will throw at runtime if RESEND_API_KEY is not set
 */
export const resend = new Resend(apiKey)

/**
 * Validate that Resend is properly configured before sending emails
 */
export function validateResendConfig() {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'build-time-placeholder') {
    throw new Error('RESEND_API_KEY environment variable is required to send emails')
  }
}

/**
 * Default sender email address
 * Must be a verified domain in Resend
 */
export const FROM_EMAIL = process.env.FROM_EMAIL ?? 'noreply@scholarshiphunter.com'
