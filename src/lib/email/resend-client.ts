/**
 * Resend Email Client
 *
 * Singleton Resend client for transactional email delivery
 *
 * @module lib/email/resend-client
 */

import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is required')
}

/**
 * Resend client instance for sending transactional emails
 */
export const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Default sender email address
 * Must be a verified domain in Resend
 */
export const FROM_EMAIL = process.env.FROM_EMAIL ?? 'noreply@scholarshiphunter.com'
