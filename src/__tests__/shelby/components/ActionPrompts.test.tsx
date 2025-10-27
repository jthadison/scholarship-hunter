/**
 * Unit Tests for ActionPrompts Component
 *
 * Tests action prompt generation based on match data
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ActionPrompts } from '@/modules/shelby/components/ActionPrompts'
import type { MatchWithScholarship } from '@/modules/shelby/types'
import { addDays } from 'date-fns'

const createMockMatch = (
  name: string,
  deadlineDays: number,
  scholarshipId = 'scholarship-1'
): MatchWithScholarship => ({
  id: `match-${scholarshipId}`,
  studentId: 'student-1',
  scholarshipId,
  overallMatchScore: 85,
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
    id: scholarshipId,
    name,
    provider: 'Test Provider',
    awardAmount: 5000,
    awardAmountMax: null,
    deadline: addDays(new Date(), deadlineDays),
    description: 'Test description',
    website: 'https://example.com',
  },
})

describe('ActionPrompts Component', () => {
  const tierCounts = {
    MUST_APPLY: 5,
    SHOULD_APPLY: 12,
    IF_TIME_PERMITS: 20,
    HIGH_VALUE_REACH: 3,
  }

  it('should display upcoming deadline prompt with closest deadline', () => {
    const matches = [
      createMockMatch('Scholarship A', 30, 'sch-1'),
      createMockMatch('Scholarship B', 15, 'sch-2'),
      createMockMatch('Scholarship C', 45, 'sch-3'),
    ]

    render(<ActionPrompts matches={matches} tierCounts={tierCounts} />)

    // Should show the scholarship with closest deadline
    expect(screen.getByText(/Scholarship B/)).toBeInTheDocument()
    expect(screen.getByText(/days left/)).toBeInTheDocument()
  })

  it('should display SHOULD_APPLY exploration prompt', () => {
    const matches = [createMockMatch('Test Scholarship', 30)]
    const tierCounts = {
      MUST_APPLY: 5,
      SHOULD_APPLY: 12,
      IF_TIME_PERMITS: 20,
      HIGH_VALUE_REACH: 3,
    }

    render(<ActionPrompts matches={matches} tierCounts={tierCounts} />)

    expect(screen.getByText(/12/)).toBeInTheDocument()
    expect(screen.getByText(/SHOULD_APPLY opportunities/)).toBeInTheDocument()
  })

  it('should use singular "opportunity" for 1 SHOULD_APPLY match', () => {
    const matches = [createMockMatch('Test Scholarship', 30)]
    const tierCounts = {
      MUST_APPLY: 5,
      SHOULD_APPLY: 1,
      IF_TIME_PERMITS: 20,
      HIGH_VALUE_REACH: 3,
    }

    render(<ActionPrompts matches={matches} tierCounts={tierCounts} />)

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText(/SHOULD_APPLY opportunity/)).toBeInTheDocument()
  })

  it('should not display SHOULD_APPLY prompt when count is 0', () => {
    const matches = [createMockMatch('Test Scholarship', 30)]
    const tierCounts = {
      MUST_APPLY: 5,
      SHOULD_APPLY: 0,
      IF_TIME_PERMITS: 20,
      HIGH_VALUE_REACH: 3,
    }

    render(<ActionPrompts matches={matches} tierCounts={tierCounts} />)

    expect(screen.queryByText(/SHOULD_APPLY/)).not.toBeInTheDocument()
  })

  it('should display encouraging message when no matches', () => {
    const matches: MatchWithScholarship[] = []
    const tierCounts = {
      MUST_APPLY: 0,
      SHOULD_APPLY: 0,
      IF_TIME_PERMITS: 0,
      HIGH_VALUE_REACH: 0,
    }

    render(<ActionPrompts matches={matches} tierCounts={tierCounts} />)

    expect(screen.getByText(/Build your profile to unlock MUST_APPLY matches/)).toBeInTheDocument()
  })

  it('should render Start Application button linking to scholarship', () => {
    const matches = [createMockMatch('Test Scholarship', 30, 'test-id')]

    render(<ActionPrompts matches={matches} tierCounts={tierCounts} />)

    const startButton = screen.getByText('Start Application').closest('a')
    expect(startButton).toHaveAttribute('href', '/scholarships/test-id')
  })

  it('should render Explore Now button linking to SHOULD_APPLY filter', () => {
    const matches = [createMockMatch('Test Scholarship', 30)]

    render(<ActionPrompts matches={matches} tierCounts={tierCounts} />)

    const exploreButton = screen.getByText('Explore Now').closest('a')
    expect(exploreButton).toHaveAttribute('href', '/scholarships?tier=SHOULD_APPLY')
  })

  it('should not display deadline prompt for past deadlines', () => {
    const matches = [createMockMatch('Past Scholarship', -5)]
    const tierCounts = {
      MUST_APPLY: 5,
      SHOULD_APPLY: 12,
      IF_TIME_PERMITS: 20,
      HIGH_VALUE_REACH: 3,
    }

    render(<ActionPrompts matches={matches} tierCounts={tierCounts} />)

    // Should not show upcoming deadline for past deadlines
    expect(screen.queryByText(/Upcoming Deadline/)).not.toBeInTheDocument()
  })
})
