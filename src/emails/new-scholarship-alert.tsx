/**
 * New Scholarship Alert Email Template
 *
 * Mobile-responsive email template for notifying students of new high-match scholarships
 *
 * @module emails/new-scholarship-alert
 */

import * as React from 'react'

export interface NewScholarshipAlertProps {
  studentName: string
  scholarshipName: string
  matchScore: number
  awardAmount: number
  daysUntilDeadline: number
  scholarshipUrl: string
  priorityTier: string
  unsubscribeUrl?: string
}

/**
 * New Scholarship Alert Email
 *
 * Format: "New scholarship alert: [Name] - 94% match, $5,000 award, deadline in 45 days"
 */
export const NewScholarshipAlert = ({
  studentName,
  scholarshipName,
  matchScore,
  awardAmount,
  daysUntilDeadline,
  scholarshipUrl,
  priorityTier,
  unsubscribeUrl,
}: NewScholarshipAlertProps) => {
  const priorityColor = priorityTier === 'MUST_APPLY' ? '#dc2626' : '#f59e0b'
  const priorityLabel = priorityTier === 'MUST_APPLY' ? 'Must Apply' : 'Should Apply'

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          lineHeight: '1.6',
          color: '#333333',
          backgroundColor: '#f5f5f5',
          margin: 0,
          padding: 0,
        }}
      >
        <table
          width="100%"
          cellPadding="0"
          cellSpacing="0"
          style={{ backgroundColor: '#f5f5f5', padding: '20px 0' }}
        >
          <tr>
            <td align="center">
              <table
                width="600"
                cellPadding="0"
                cellSpacing="0"
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  maxWidth: '600px',
                }}
              >
                {/* Header */}
                <tr>
                  <td
                    style={{
                      backgroundColor: '#3b82f6',
                      color: '#ffffff',
                      padding: '24px',
                      borderTopLeftRadius: '8px',
                      borderTopRightRadius: '8px',
                    }}
                  >
                    <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                      New Scholarship Match!
                    </h1>
                  </td>
                </tr>

                {/* Content */}
                <tr>
                  <td style={{ padding: '32px 24px' }}>
                    <p style={{ fontSize: '16px', marginTop: 0 }}>Hi {studentName},</p>

                    <p style={{ fontSize: '16px' }}>
                      Great news! We found a new scholarship that's a <strong>{matchScore}% match</strong> for
                      your profile.
                    </p>

                    {/* Scholarship Card */}
                    <table
                      width="100%"
                      cellPadding="0"
                      cellSpacing="0"
                      style={{
                        backgroundColor: '#f8fafc',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        marginTop: '24px',
                        marginBottom: '24px',
                      }}
                    >
                      <tr>
                        <td style={{ padding: '20px' }}>
                          {/* Priority Badge */}
                          <div
                            style={{
                              display: 'inline-block',
                              backgroundColor: priorityColor,
                              color: '#ffffff',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                              marginBottom: '12px',
                            }}
                          >
                            {priorityLabel}
                          </div>

                          <h2
                            style={{
                              margin: '12px 0 16px 0',
                              fontSize: '20px',
                              fontWeight: 'bold',
                              color: '#1e293b',
                            }}
                          >
                            {scholarshipName}
                          </h2>

                          <table width="100%" cellPadding="0" cellSpacing="0">
                            <tr>
                              <td style={{ paddingBottom: '8px' }}>
                                <span style={{ fontSize: '14px', color: '#64748b' }}>Match Score:</span>
                                <br />
                                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                                  {matchScore}%
                                </span>
                              </td>
                              <td style={{ paddingBottom: '8px' }}>
                                <span style={{ fontSize: '14px', color: '#64748b' }}>Award Amount:</span>
                                <br />
                                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6' }}>
                                  ${awardAmount.toLocaleString()}
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td colSpan={2} style={{ paddingTop: '8px' }}>
                                <span style={{ fontSize: '14px', color: '#64748b' }}>Deadline:</span>
                                <br />
                                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#f59e0b' }}>
                                  {daysUntilDeadline} days remaining
                                </span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    {/* CTA Button */}
                    <table width="100%" cellPadding="0" cellSpacing="0">
                      <tr>
                        <td align="center" style={{ paddingTop: '8px' }}>
                          <a
                            href={scholarshipUrl}
                            style={{
                              display: 'inline-block',
                              backgroundColor: '#3b82f6',
                              color: '#ffffff',
                              padding: '14px 32px',
                              borderRadius: '6px',
                              textDecoration: 'none',
                              fontWeight: 'bold',
                              fontSize: '16px',
                            }}
                          >
                            View Scholarship Details
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style={{ fontSize: '14px', color: '#64748b', marginTop: '24px' }}>
                      <strong>Why this matters:</strong> Based on your profile, this scholarship has a high
                      probability of success. We recommend reviewing it as soon as possible.
                    </p>
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td
                    style={{
                      backgroundColor: '#f8fafc',
                      padding: '20px 24px',
                      borderTop: '1px solid #e2e8f0',
                      borderBottomLeftRadius: '8px',
                      borderBottomRightRadius: '8px',
                    }}
                  >
                    <p
                      style={{
                        fontSize: '12px',
                        color: '#64748b',
                        margin: 0,
                        textAlign: 'center',
                      }}
                    >
                      © {new Date().getFullYear()} Scholarship Hunter. All rights reserved.
                      <br />
                      {unsubscribeUrl && (
                        <>
                          <a
                            href={unsubscribeUrl}
                            style={{ color: '#3b82f6', textDecoration: 'none' }}
                          >
                            Unsubscribe
                          </a>
                          {' | '}
                        </>
                      )}
                      <a
                        href={`${scholarshipUrl.split('/scholarships')[0]}/settings/notifications`}
                        style={{ color: '#3b82f6', textDecoration: 'none' }}
                      >
                        Notification Preferences
                      </a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  )
}

export default NewScholarshipAlert
