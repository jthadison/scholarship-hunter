/**
 * Story 5.7: Scholarship Recommendation Email Template
 *
 * React Email template for counselor scholarship recommendations
 * Sent when a counselor recommends a scholarship to a student
 *
 * @module emails/ScholarshipRecommendationEmail
 */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

export interface ScholarshipRecommendationEmailProps {
  studentName: string
  counselorName: string
  counselorSchool: string
  scholarshipName: string
  scholarshipProvider: string
  awardAmount: number
  deadline: Date
  counselorNote?: string
  viewUrl: string
  scholarshipUrl: string
}

/**
 * Email template for scholarship recommendations
 *
 * Task 5.1: Create email template for scholarship recommendation
 * AC #3: Student receives email notification
 */
export default function ScholarshipRecommendationEmail({
  studentName = 'Alex',
  counselorName = 'Ms. Johnson',
  counselorSchool = 'Lincoln High School',
  scholarshipName = 'Women in STEM Scholarship',
  scholarshipProvider = 'National STEM Foundation',
  awardAmount = 5000,
  deadline = new Date('2024-12-31'),
  counselorNote = 'This scholarship is a perfect fit for your strong academic performance and interest in computer science.',
  viewUrl = 'https://scholarshiphunter.com/dashboard/recommendations',
  scholarshipUrl = 'https://scholarshiphunter.com/scholarships/1',
}: ScholarshipRecommendationEmailProps) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(awardAmount)

  const formattedDeadline = new Date(deadline).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Html>
      <Head />
      <Preview>
        {counselorName} recommends {scholarshipName} - {formattedAmount} opportunity
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>New Scholarship Recommendation</Heading>
          </Section>

          {/* Greeting */}
          <Section style={section}>
            <Text style={text}>Hi {studentName},</Text>
            <Text style={text}>
              <strong>{counselorName}</strong> from {counselorSchool} has recommended a
              scholarship opportunity for you!
            </Text>
          </Section>

          {/* Scholarship Details */}
          <Section style={scholarshipBox}>
            <Heading as="h2" style={h2}>
              {scholarshipName}
            </Heading>
            <Text style={textMuted}>{scholarshipProvider}</Text>

            <div style={detailsGrid}>
              <div style={detailItem}>
                <Text style={detailLabel}>Award Amount</Text>
                <Text style={detailValue}>{formattedAmount}</Text>
              </div>
              <div style={detailItem}>
                <Text style={detailLabel}>Deadline</Text>
                <Text style={detailValue}>{formattedDeadline}</Text>
              </div>
            </div>
          </Section>

          {/* Counselor Note */}
          {counselorNote && (
            <Section style={noteBox}>
              <Text style={noteLabel}>Why {counselorName} recommends this:</Text>
              <Text style={noteText}>&ldquo;{counselorNote}&rdquo;</Text>
            </Section>
          )}

          {/* Call to Action */}
          <Section style={section}>
            <Text style={text}>
              Review this recommendation and decide if you'd like to add it to your
              applications. Your counselor has identified this as a great fit for you!
            </Text>
          </Section>

          {/* Action Buttons */}
          <Section style={buttonContainer}>
            <Button style={primaryButton} href={viewUrl}>
              View Recommendation
            </Button>
          </Section>

          <Section style={section}>
            <Link href={scholarshipUrl} style={link}>
              Learn more about this scholarship →
            </Link>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              You received this email because {counselorName} recommended a scholarship for
              you through Scholarship Hunter.
            </Text>
            <Text style={footerText}>
              You can manage your counselor permissions in your{' '}
              <Link href={`${viewUrl}/settings`} style={link}>
                account settings
              </Link>
              .
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  maxWidth: '600px',
}

const header = {
  backgroundColor: '#6366f1',
  padding: '24px',
  borderRadius: '8px 8px 0 0',
}

const h1 = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
  lineHeight: '1.4',
}

const h2 = {
  color: '#1e293b',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
  lineHeight: '1.4',
}

const section = {
  padding: '0 24px',
  marginBottom: '24px',
}

const text = {
  color: '#334155',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 12px 0',
}

const textMuted = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
}

const scholarshipBox = {
  backgroundColor: '#f1f5f9',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '24px',
  margin: '0 24px 24px 24px',
}

const detailsGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
  marginTop: '16px',
}

const detailItem = {
  padding: '0',
}

const detailLabel = {
  color: '#64748b',
  fontSize: '12px',
  fontWeight: '500',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 4px 0',
}

const detailValue = {
  color: '#1e293b',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0',
}

const noteBox = {
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderLeft: '4px solid #3b82f6',
  borderRadius: '6px',
  padding: '16px 20px',
  margin: '0 24px 24px 24px',
}

const noteLabel = {
  color: '#1e40af',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 8px 0',
}

const noteText = {
  color: '#1e3a8a',
  fontSize: '15px',
  fontStyle: 'italic' as const,
  lineHeight: '1.6',
  margin: '0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  padding: '0 24px',
  marginBottom: '24px',
}

const primaryButton = {
  backgroundColor: '#6366f1',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
}

const link = {
  color: '#6366f1',
  fontSize: '14px',
  textDecoration: 'underline',
}

const footer = {
  borderTop: '1px solid #e2e8f0',
  padding: '24px 24px 0 24px',
  marginTop: '32px',
}

const footerText = {
  color: '#64748b',
  fontSize: '12px',
  lineHeight: '1.6',
  margin: '0 0 12px 0',
}
