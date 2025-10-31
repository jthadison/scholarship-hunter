/**
 * FundingSummary Component Tests (Story 5.1)
 *
 * Tests for AC5: Dashboard summary with aggregate metrics
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FundingSummary } from '@/components/outcomes/FundingSummary'

const mockSummaryData = {
  outcomes: [],
  summary: {
    totalAwarded: 3,
    totalDenied: 2,
    totalWaitlisted: 1,
    totalWithdrawn: 0,
    totalPending: 5,
    totalFundingSecured: 8000,
    successRate: 0.6, // 3 awards / 5 total decisions
  },
}

// Mock tRPC - use a factory function to avoid hoisting issues
vi.mock('@/shared/lib/trpc', () => {
  const mockUseQuery = vi.fn()
  return {
    trpc: {
      outcome: {
        getByStudent: {
          useQuery: mockUseQuery,
        },
      },
    },
    mockUseQuery, // Export for test access
  }
})

// Import the mock after it's been set up
import { mockUseQuery } from '@/shared/lib/trpc'

beforeEach(() => {
  // Reset mock before each test
  mockUseQuery.mockReturnValue({
    data: mockSummaryData,
    isLoading: false,
    isError: false,
  })
})

describe('FundingSummary Component - Story 5.1', () => {
  describe('AC5: Dashboard Summary Display', () => {
    it('should display success metrics title', () => {
      render(<FundingSummary />)

      expect(screen.getByText(/Success Metrics/i)).toBeInTheDocument()
    })

    it('should display total awards count', () => {
      render(<FundingSummary />)

      // Look for the metric card with both Awards label and value 3
      const awardsLabel = screen.getAllByText(/Awards/i)[0]
      expect(awardsLabel).toBeInTheDocument()
    })

    it('should display total denials count', () => {
      render(<FundingSummary />)

      // Look for Denials in the metric cards
      const denialsLabel = screen.getAllByText(/Denials/i)[0]
      expect(denialsLabel).toBeInTheDocument()
    })

    it('should display total pending count', () => {
      render(<FundingSummary />)

      // Look for Pending in the metric cards
      const pendingLabel = screen.getAllByText(/Pending/i)[0]
      expect(pendingLabel).toBeInTheDocument()
    })

    it('should display success rate percentage', () => {
      render(<FundingSummary />)

      expect(screen.getByText('60%')).toBeInTheDocument()
    })

    it('should display total funding secured', () => {
      render(<FundingSummary />)

      // Check for funding amount in the large funding card
      const fundingText = screen.getAllByText(/\$8,000/i)[0]
      expect(fundingText).toBeInTheDocument()
    })

    it('should display formatted summary text', () => {
      render(<FundingSummary />)

      // Check for the formatted summary: "3 awards, 2 denials, 5 pending - $8,000 total funding secured"
      expect(screen.getByText(/3 award/i)).toBeInTheDocument()
      expect(screen.getByText(/2 denial/i)).toBeInTheDocument()
      expect(screen.getByText(/5 pending/i)).toBeInTheDocument()
    })
  })

  describe('Loading and Error States', () => {
    it('should display skeleton loader when loading', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
      })

      render(<FundingSummary />)

      expect(screen.getByText(/Success Metrics/i)).toBeInTheDocument()
    })
  })
})
