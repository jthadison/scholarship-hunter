/**
 * Integration Tests for ShelbyDashboard
 *
 * Tests the full Shelby dashboard with mocked tRPC data
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ShelbyDashboard } from '@/modules/shelby/components/ShelbyDashboard'
import type { MatchWithScholarship } from '@/modules/shelby/types'
import { addDays } from 'date-fns'

// Mock tRPC
vi.mock('@/shared/lib/trpc', () => ({
  trpc: {
    useUtils: vi.fn(() => ({
      matching: {
        invalidate: vi.fn(),
      },
    })),
    auth: {
      getSession: {
        useQuery: vi.fn(),
      },
    },
    matching: {
      getMatchesByTier: {
        useQuery: vi.fn(),
      },
      getMatchStats: {
        useQuery: vi.fn(),
      },
      getTierCounts: {
        useQuery: vi.fn(),
      },
      getMatches: {
        useQuery: vi.fn(),
      },
      recalculateMatches: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          isLoading: false,
        })),
      },
    },
  },
}))

const createMockMatch = (
  id: string,
  name: string,
  score: number,
  amount: number,
  deadlineDays: number
): MatchWithScholarship => ({
  id,
  studentId: 'student-1',
  scholarshipId: `scholarship-${id}`,
  overallMatchScore: score,
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
    id: `scholarship-${id}`,
    name,
    provider: 'Test Provider',
    awardAmount: amount,
    awardAmountMax: null,
    deadline: addDays(new Date(), deadlineDays),
    description: `Description for ${name}`,
    website: 'https://example.com',
  },
})

describe('ShelbyDashboard Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display personalized greeting with student name', async () => {
    const { trpc } = await import('@/shared/lib/trpc')

    // Mock session
    vi.mocked(trpc.auth.getSession.useQuery).mockReturnValue({
      data: { student: { id: 'student-1' } },
      isLoading: false,
    } as any)

    // Mock empty matches
    vi.mocked(trpc.matching.getMatchesByTier.useQuery).mockReturnValue({
      data: { matches: [] },
      isLoading: false,
    } as any)

    vi.mocked(trpc.matching.getMatchStats.useQuery).mockReturnValue({
      data: { totalMatches: 0, topMatches: [] },
      isLoading: false,
    } as any)

    vi.mocked(trpc.matching.getTierCounts.useQuery).mockReturnValue({
      data: { MUST_APPLY: 0, SHOULD_APPLY: 0, IF_TIME_PERMITS: 0, HIGH_VALUE_REACH: 0 },
    } as any)

    vi.mocked(trpc.matching.getMatches.useQuery).mockReturnValue({
      data: { matches: [] },
    } as any)

    render(<ShelbyDashboard firstName="Sarah" />)

    await waitFor(() => {
      expect(screen.getByText(/Hi Sarah!/)).toBeInTheDocument()
    })
  })

  it('should display top 5 MUST_APPLY scholarships', async () => {
    const { trpc } = await import('@/shared/lib/trpc')

    const mockMatches = [
      createMockMatch('match-1', 'Scholarship A', 95, 10000, 30),
      createMockMatch('match-2', 'Scholarship B', 90, 8000, 45),
      createMockMatch('match-3', 'Scholarship C', 85, 5000, 60),
      createMockMatch('match-4', 'Scholarship D', 80, 7500, 15),
      createMockMatch('match-5', 'Scholarship E', 75, 3000, 90),
    ]

    vi.mocked(trpc.auth.getSession.useQuery).mockReturnValue({
      data: { student: { id: 'student-1' } },
      isLoading: false,
    } as any)

    vi.mocked(trpc.matching.getMatchesByTier.useQuery).mockReturnValue({
      data: { matches: mockMatches },
      isLoading: false,
    } as any)

    vi.mocked(trpc.matching.getMatchStats.useQuery).mockReturnValue({
      data: {
        totalMatches: 47,
        topMatches: mockMatches.map((m) => ({
          scholarshipId: m.scholarshipId,
          scholarshipName: m.scholarship.name,
          provider: m.scholarship.provider,
          awardAmount: m.scholarship.awardAmount,
          overallMatchScore: m.overallMatchScore,
          priorityTier: m.priorityTier,
        })),
      },
      isLoading: false,
    } as any)

    vi.mocked(trpc.matching.getTierCounts.useQuery).mockReturnValue({
      data: { MUST_APPLY: 5, SHOULD_APPLY: 12, IF_TIME_PERMITS: 20, HIGH_VALUE_REACH: 10 },
    } as any)

    vi.mocked(trpc.matching.getMatches.useQuery).mockReturnValue({
      data: { matches: mockMatches },
    } as any)

    render(<ShelbyDashboard firstName="Sarah" />)

    await waitFor(() => {
      // Use getAllByText since scholarship names appear in both prompts and cards
      const scholarshipAElements = screen.getAllByText('Scholarship A')
      const scholarshipBElements = screen.getAllByText('Scholarship B')

      expect(scholarshipAElements.length).toBeGreaterThan(0)
      expect(scholarshipBElements.length).toBeGreaterThan(0)
    })
  })

  it('should display quick stats correctly', async () => {
    const { trpc } = await import('@/shared/lib/trpc')

    const mockMatches = [
      createMockMatch('match-1', 'Scholarship A', 95, 10000, 30),
      createMockMatch('match-2', 'Scholarship B', 90, 5000, 45),
    ]

    vi.mocked(trpc.auth.getSession.useQuery).mockReturnValue({
      data: { student: { id: 'student-1' } },
      isLoading: false,
    } as any)

    vi.mocked(trpc.matching.getMatchesByTier.useQuery).mockReturnValue({
      data: { matches: mockMatches },
      isLoading: false,
    } as any)

    vi.mocked(trpc.matching.getMatchStats.useQuery).mockReturnValue({
      data: {
        totalMatches: 47,
        topMatches: [{ overallMatchScore: 95 }],
      },
      isLoading: false,
    } as any)

    vi.mocked(trpc.matching.getTierCounts.useQuery).mockReturnValue({
      data: { MUST_APPLY: 5, SHOULD_APPLY: 12, IF_TIME_PERMITS: 20, HIGH_VALUE_REACH: 10 },
    } as any)

    vi.mocked(trpc.matching.getMatches.useQuery).mockReturnValue({
      data: { matches: mockMatches },
    } as any)

    render(<ShelbyDashboard firstName="Sarah" />)

    await waitFor(() => {
      // Use getAllByText since "47" appears in both header and stats card
      const totalMatchElements = screen.getAllByText('47')
      expect(totalMatchElements.length).toBeGreaterThan(0)

      // Total potential funding (10000 + 5000 = 15000)
      expect(screen.getByText('$15,000')).toBeInTheDocument()

      // Highest match score
      expect(screen.getByText('95')).toBeInTheDocument()
    })
  })

  it('should display loading skeletons while fetching data', async () => {
    const { trpc } = await import('@/shared/lib/trpc')

    vi.mocked(trpc.auth.getSession.useQuery).mockReturnValue({
      data: null,
      isLoading: true,
    } as any)

    const { container } = render(<ShelbyDashboard firstName="Sarah" />)

    // Should show skeleton loaders
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should display error state when matches fail to load', async () => {
    const { trpc } = await import('@/shared/lib/trpc')

    vi.mocked(trpc.auth.getSession.useQuery).mockReturnValue({
      data: { student: { id: 'student-1' } },
      isLoading: false,
    } as any)

    vi.mocked(trpc.matching.getMatchesByTier.useQuery).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load matches'),
    } as any)

    render(<ShelbyDashboard firstName="Sarah" />)

    await waitFor(() => {
      expect(screen.getByText(/Unable to load scholarship matches/)).toBeInTheDocument()
    })
  })

  it('should display encouraging message when no MUST_APPLY scholarships', async () => {
    const { trpc } = await import('@/shared/lib/trpc')

    vi.mocked(trpc.auth.getSession.useQuery).mockReturnValue({
      data: { student: { id: 'student-1' } },
      isLoading: false,
    } as any)

    vi.mocked(trpc.matching.getMatchesByTier.useQuery).mockReturnValue({
      data: { matches: [] },
      isLoading: false,
    } as any)

    vi.mocked(trpc.matching.getMatchStats.useQuery).mockReturnValue({
      data: { totalMatches: 0, topMatches: [] },
      isLoading: false,
    } as any)

    vi.mocked(trpc.matching.getTierCounts.useQuery).mockReturnValue({
      data: { MUST_APPLY: 0, SHOULD_APPLY: 0, IF_TIME_PERMITS: 0, HIGH_VALUE_REACH: 0 },
    } as any)

    vi.mocked(trpc.matching.getMatches.useQuery).mockReturnValue({
      data: { matches: [] },
    } as any)

    render(<ShelbyDashboard firstName="Sarah" />)

    await waitFor(() => {
      expect(
        screen.getByText(/No scholarship matches yet! Click "Find Matches" to discover opportunities./)
      ).toBeInTheDocument()
    })
  })
})
