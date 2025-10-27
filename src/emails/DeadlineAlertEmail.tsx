/**
 * Story 3.4: Deadline Alert Email Template
 *
 * React Email template for deadline alert notifications
 * Supports 4 urgency levels with escalating tone and visual styling
 *
 * @module emails/DeadlineAlertEmail
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

export type UrgencyLevel = 'INFO' | 'WARNING' | 'URGENT' | 'CRITICAL'

export interface DeadlineAlertEmailProps {
  studentName: string
  scholarshipName: string
  awardAmount: number
  daysRemaining: number
  urgencyLevel: UrgencyLevel
  applicationUrl: string
  snoozeUrl: string
  dismissUrl: string
}

/**
 * Get urgency-specific styling and content
 */
function getUrgencyConfig(urgencyLevel: UrgencyLevel, daysRemaining: number) {
  const configs = {
    INFO: {
      color: '#3b82f6', // Blue
      emoji: '\u2139\uFE0F', // ℹ️ Information
      subject: `Upcoming Deadline Reminder`,
      message: `You have ${daysRemaining} days to complete your application. There's plenty of time to prepare a strong submission.`,
    },
    WARNING: {
      color: '#f59e0b', // Yellow/Amber
      emoji: '\u26A0\uFE0F', // ⚠️ Warning
      subject: `Action Needed Soon`,
      message: `You have ${daysRemaining} days left. It's time to start working on this application to ensure quality submission.`,
    },
    URGENT: {
      color: '#f97316', // Orange
      emoji: '\u{1F525}', // 🔥 Fire
      subject: `URGENT: Action Required`,
      message: `Only ${daysRemaining} days remaining! Please prioritize this application and complete the required tasks immediately.`,
    },
    CRITICAL: {
      color: '#ef4444', // Red
      emoji: '\u{1F6A8}', // 🚨 Police car light
      subject: `\u{1F6A8} CRITICAL: Deadline ${daysRemaining === 0 ? 'TODAY' : 'Tomorrow'}`,
      message:
        daysRemaining === 0
          ? `⚠️ DEADLINE IS TODAY! This is your final opportunity to submit your application. Act now!`
          : `⚠️ Final 24 hours! Submit your application today to avoid missing this opportunity.`,
    },
  }

  return configs[urgencyLevel]
}

export default function DeadlineAlertEmail({
  studentName = 'Student',
  scholarshipName = 'Women in STEM Scholarship',
  awardAmount = 5000,
  daysRemaining = 7,
  urgencyLevel = 'WARNING',
  applicationUrl = 'https://scholarshiphunter.com/applications/1',
  snoozeUrl = 'https://scholarshiphunter.com/alerts/snooze?token=abc123',
  dismissUrl = 'https://scholarshiphunter.com/alerts/dismiss?token=abc123',
}: DeadlineAlertEmailProps) {
  const config = getUrgencyConfig(urgencyLevel, daysRemaining)
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(awardAmount)

  return (
    <Html>
      <Head />
      <Preview>
        {config.emoji} {config.subject}: {scholarshipName} due in{' '}
        {String(daysRemaining)} days
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with urgency indicator */}
          <Section style={{ ...header, backgroundColor: config.color }}>
            <Heading style={h1}>
              {config.emoji} Deadline Alert
            </Heading>
          </Section>

          {/* Greeting */}
          <Section style={content}>
            <Text style={paragraph}>Hi {studentName},</Text>

            {/* Urgency message */}
            <Section style={{ ...alertBox, borderLeftColor: config.color }}>
              <Text style={{ ...paragraph, marginBottom: '0' }}>
                {config.message}
              </Text>
            </Section>

            {/* Scholarship details */}
            <Section style={detailsBox}>
              <Heading style={h2}>{scholarshipName}</Heading>
              <Text style={detailRow}>
                <strong>Award Amount:</strong> {formattedAmount}
              </Text>
              <Text style={detailRow}>
                <strong>Days Remaining:</strong> {daysRemaining}{' '}
                {daysRemaining === 1 ? 'day' : 'days'}
              </Text>
              <Text style={{ ...detailRow, marginBottom: '0' }}>
                <strong>Status:</strong> Incomplete - Action Required
              </Text>
            </Section>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button
                style={{ ...button, backgroundColor: config.color }}
                href={applicationUrl}
              >
                View Application Workspace
              </Button>
            </Section>

            {/* Suppression links */}
            <Section style={footer}>
              <Text style={footerText}>
                <Link href={snoozeUrl} style={link}>
                  Snooze for 24 hours
                </Link>
                {' | '}
                <Link href={dismissUrl} style={link}>
                  Dismiss this alert
                </Link>
              </Text>
            </Section>

            {/* Signature */}
            <Text style={signature}>
              Best,
              <br />
              Quinn - Your Timeline Coordinator
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
  maxWidth: '600px',
}

const header = {
  padding: '24px',
  textAlign: 'center' as const,
}

const h1 = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
}

const h2 = {
  color: '#1f2937',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 12px',
}

const content = {
  padding: '0 48px',
}

const paragraph = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  marginBottom: '16px',
}

const alertBox = {
  backgroundColor: '#fef3c7',
  borderLeft: '4px solid',
  padding: '16px',
  marginBottom: '24px',
}

const detailsBox = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '24px',
}

const detailRow = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '20px',
  marginBottom: '8px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  marginBottom: '32px',
}

const button = {
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
  color: '#ffffff',
  borderRadius: '6px',
}

const footer = {
  borderTop: '1px solid #e5e7eb',
  paddingTop: '16px',
  marginTop: '32px',
  textAlign: 'center' as const,
}

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
}

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
}

const signature = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  marginTop: '24px',
}
