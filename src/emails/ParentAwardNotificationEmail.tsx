/**
 * Story 5.8: Parent Award Notification Email Template
 *
 * React Email template for notifying parents when student receives an award
 *
 * @module emails/ParentAwardNotificationEmail
 */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

export interface ParentAwardNotificationEmailProps {
  parentName: string
  studentName: string
  scholarshipName: string
  awardAmount: number
  dashboardUrl: string
}

export default function ParentAwardNotificationEmail({
  parentName = 'Parent',
  studentName = 'Student',
  scholarshipName = 'Merit Scholarship',
  awardAmount = 5000,
  dashboardUrl = 'https://scholarshiphunter.com/parent/dashboard',
}: ParentAwardNotificationEmailProps) {
  const previewText = `Great news! ${studentName} was awarded ${scholarshipName}!`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={heading}>🎉 Great News!</Heading>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Text style={paragraph}>Hi {parentName},</Text>

            <Text style={paragraph}>
              We're excited to share that <strong>{studentName}</strong> has been awarded the{' '}
              <strong>{scholarshipName}</strong>!
            </Text>

            <Section style={awardBox}>
              <Text style={awardText}>Award Amount: ${awardAmount.toLocaleString()}</Text>
            </Section>

            <Text style={paragraph}>
              This is a wonderful achievement and represents hard work and dedication. Take a moment
              to celebrate this milestone together!
            </Text>

            <Button style={button} href={dashboardUrl}>
              View Dashboard
            </Button>

            <Text style={paragraph}>
              You can see all of {studentName}'s scholarship progress in your parent portal.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              This is an automated notification from Scholarship Hunter. You're receiving this
              because {studentName} granted you access to view their scholarship progress.
            </Text>
            <Text style={footerText}>
              <a href={`${dashboardUrl}/settings`} style={link}>
                Manage notification preferences
              </a>
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
}

const header = {
  padding: '32px 24px',
  backgroundColor: '#10b981',
  textAlign: 'center' as const,
}

const heading = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#ffffff',
  margin: '0',
}

const content = {
  padding: '0 24px',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#374151',
}

const awardBox = {
  backgroundColor: '#f0fdf4',
  border: '2px solid #10b981',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
  textAlign: 'center' as const,
}

const awardText = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#059669',
  margin: '0',
}

const button = {
  backgroundColor: '#10b981',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px',
  margin: '24px 0',
}

const footer = {
  padding: '0 24px',
  marginTop: '32px',
  borderTop: '1px solid #e5e7eb',
  paddingTop: '24px',
}

const footerText = {
  fontSize: '12px',
  lineHeight: '18px',
  color: '#6b7280',
}

const link = {
  color: '#10b981',
  textDecoration: 'underline',
}
