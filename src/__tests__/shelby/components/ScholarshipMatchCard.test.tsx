/**
 * Unit Tests for ScholarshipMatchCard Component
 *
 * Tests rendering of scholarship match cards with deadline calculations and formatting
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScholarshipMatchCard } from '@/modules/shelby/components/ScholarshipMatchCard'
import type { MatchWithScholarship } from '@/modules/shelby/types'
import { addDays, addMonths } from 'date-fns'

const createMockMatch = (overrides?: Partial<MatchWithScholarship>): MatchWithScholarship => ({
  id: 'match-1',
  studentId: 'student-1',
  scholarshipId: 'scholarship-1',
  overallMatchScore: 85.5,
  academicScore: 80,
  demographicScore: 90,
  majorFieldScore: 85,
  experienceScore: 80,
  financialScore: 90,
  specialCriteriaScore: 75,
  successProbability: 70,
  successTier: 'STRONG_MATCH',
  competitionFactor: 0.5,
  priorityTier: 'MUST_APPLY',
  strategicValue: 8.5,
  applicationEffort: 'MEDIUM',
  effortBreakdown: null,
  strategicValueTier: 'BEST_BET',
  missingCriteria: null,
  improvementImpact: null,
  calculatedAt: new Date(),
  notified: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  scholarship: {
    id: 'scholarship-1',
    name: 'Academic Excellence Scholarship',
    provider: 'University Foundation',
    awardAmount: 5000,
    awardAmountMax: null,
    deadline: addMonths(new Date(), 2),
    description: 'For outstanding academic achievement',
    website: 'https://example.com',
  },
  ...overrides,
})

describe('ScholarshipMatchCard Component', () => {
  it('should render scholarship name and provider', () => {
    const match = createMockMatch()
    render(<ScholarshipMatchCard match={match} />)

    expect(screen.getByText('Academic Excellence Scholarship')).toBeInTheDocument()
    expect(screen.getByText('University Foundation')).toBeInTheDocument()
  })

  it('should display rounded match score', () => {
    const match = createMockMatch({ overallMatchScore: 85.7 })
    render(<ScholarshipMatchCard match={match} />)

    expect(screen.getByText(/Match: 86%/)).toBeInTheDocument()
  })

  it('should format award amount with comma separator', () => {
    const match = createMockMatch({
      scholarship: {
        ...createMockMatch().scholarship,
        awardAmount: 15000,
      },
    })
    render(<ScholarshipMatchCard match={match} />)

    expect(screen.getByText(/\$15,000/)).toBeInTheDocument()
  })

  it('should display award range when max amount is provided', () => {
    const match = createMockMatch({
      scholarship: {
        ...createMockMatch().scholarship,
        awardAmount: 5000,
        awardAmountMax: 10000,
      },
    })
    render(<ScholarshipMatchCard match={match} />)

    expect(screen.getByText(/\$5,000/)).toBeInTheDocument()
    expect(screen.getByText(/\$10,000/)).toBeInTheDocument()
  })

  it('should show green deadline color for > 30 days remaining', () => {
    const match = createMockMatch({
      scholarship: {
        ...createMockMatch().scholarship,
        deadline: addDays(new Date(), 45),
      },
    })
    render(<ScholarshipMatchCard match={match} />)

    // Find element with "days left" text and green color (date may vary by 1 day)
    const deadlineElement = screen.getByText(/\d+ days left/)
    expect(deadlineElement).toHaveClass('text-green-600')
  })

  it('should show yellow deadline color for 15-30 days remaining', () => {
    const match = createMockMatch({
      scholarship: {
        ...createMockMatch().scholarship,
        deadline: addDays(new Date(), 20),
      },
    })
    render(<ScholarshipMatchCard match={match} />)

    const deadlineElement = screen.getByText(/20 days left/)
    expect(deadlineElement).toHaveClass('text-yellow-600')
  })

  it('should show red deadline color for < 15 days remaining', () => {
    const match = createMockMatch({
      scholarship: {
        ...createMockMatch().scholarship,
        deadline: addDays(new Date(), 10),
      },
    })
    render(<ScholarshipMatchCard match={match} />)

    const deadlineElement = screen.getByText(/10 days left/)
    expect(deadlineElement).toHaveClass('text-red-600')
  })

  it('should show deadline for 1 day remaining', () => {
    const match = createMockMatch({
      scholarship: {
        ...createMockMatch().scholarship,
        deadline: addDays(new Date(), 1),
      },
    })
    render(<ScholarshipMatchCard match={match} />)

    // May show as "1 day left" or "0 days left" depending on time of day
    const hasDeadlineText = screen.queryByText(/\d+ day/)
    const isDueToday = screen.queryByText(/Due today!/)
    expect(hasDeadlineText || isDueToday).toBeTruthy()
  })

  it('should display description when provided', () => {
    const match = createMockMatch()
    render(<ScholarshipMatchCard match={match} />)

    expect(screen.getByText('For outstanding academic achievement')).toBeInTheDocument()
  })

  it('should render View Details link', () => {
    const match = createMockMatch()
    render(<ScholarshipMatchCard match={match} />)

    const viewLink = screen.getByText('View Details').closest('a')
    expect(viewLink).toHaveAttribute('href', '/scholarships/scholarship-1')
  })

  it('should render Add to Applications link', () => {
    const match = createMockMatch()
    render(<ScholarshipMatchCard match={match} />)

    const addLink = screen.getByText('Add to Applications').closest('a')
    expect(addLink).toHaveAttribute('href', '/applications/new?scholarshipId=scholarship-1')
  })
})
