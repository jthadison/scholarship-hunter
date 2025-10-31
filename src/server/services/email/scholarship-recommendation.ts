/**
 * Story 5.7: Scholarship Recommendation Email Service
 *
 * Service for sending scholarship recommendation emails to students via Resend
 * Handles template rendering, email composition, and delivery
 *
 * @module server/services/email/scholarship-recommendation
 */

import { Resend } from 'resend'
import { render } from '@react-email/render'
import ScholarshipRecommendationEmail, {
  type ScholarshipRecommendationEmailProps,
} from '@/emails/ScholarshipRecommendationEmail'
import type { ScholarshipRecommendation, Scholarship, Counselor } from '@prisma/client'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Send scholarship recommendation email to student
 *
 * Task 5.2: Integrate email service to send recommendation emails
 * AC #3: Recommendation notification: Student receives email notification
 *
 * @param studentEmail Student's email address
 * @param recommendation Recommendation with scholarship and counselor details
 * @returns Resend API response
 */
export async function sendRecommendationEmail(
  studentEmail: string,
  studentFirstName: string,
  recommendation: ScholarshipRecommendation & {
    scholarship: Scholarship
    counselor: Counselor
  }
) {
  const { scholarship, counselor, note } = recommendation

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const emailProps: ScholarshipRecommendationEmailProps = {
    studentName: studentFirstName,
    counselorName: `${counselor.firstName} ${counselor.lastName}`,
    counselorSchool: counselor.schoolName,
    scholarshipName: scholarship.name,
    scholarshipProvider: scholarship.provider,
    awardAmount: scholarship.awardAmount,
    deadline: scholarship.deadline,
    counselorNote: note || undefined,
    viewUrl: `${baseUrl}/dashboard/recommendations`,
    scholarshipUrl: `${baseUrl}/scholarships/${scholarship.id}`,
  }

  // Render email template
  const emailHtml = await render(ScholarshipRecommendationEmail(emailProps))

  // Send email via Resend
  try {
    const response = await resend.emails.send({
      from: 'Scholarship Hunter <recommendations@scholarshiphunter.com>',
      to: [studentEmail],
      subject: `Scholarship Recommendation from ${counselor.firstName} ${counselor.lastName}: ${scholarship.name}`,
      html: emailHtml,
      tags: [
        {
          name: 'category',
          value: 'scholarship-recommendation',
        },
        {
          name: 'counselor',
          value: counselor.id,
        },
      ],
    })

    return response
  } catch (error) {
    console.error('Failed to send scholarship recommendation email:', error)
    throw error
  }
}

/**
 * Batch send recommendation emails (for bulk recommendations)
 *
 * Task 5.3: Trigger email on bulk recommendation creation
 *
 * @param emails Array of student emails and recommendations
 * @param batchSize Number of emails to send per batch (default: 50)
 */
export async function batchSendRecommendationEmails(
  emails: Array<{
    studentEmail: string
    studentFirstName: string
    recommendation: ScholarshipRecommendation & {
      scholarship: Scholarship
      counselor: Counselor
    }
  }>,
  batchSize = 50
) {
  const results = {
    sent: 0,
    failed: 0,
    errors: [] as Array<{ email: string; error: unknown }>,
  }

  // Process in batches to respect rate limits
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize)

    await Promise.allSettled(
      batch.map(async ({ studentEmail, studentFirstName, recommendation }) => {
        try {
          await sendRecommendationEmail(studentEmail, studentFirstName, recommendation)
          results.sent++
        } catch (error) {
          results.failed++
          results.errors.push({ email: studentEmail, error })
        }
      })
    )

    // Wait 1 second between batches to avoid rate limiting
    if (i + batchSize < emails.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  return results
}
