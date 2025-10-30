/**
 * FundingSummary Component Tests (Story 5.1)
 *
 * Tests for AC5: Dashboard summary with aggregate metrics
 */

import { describe, it, expect, vi } from 'vitest'
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

// Mock tRPC
vi.mock('@/shared/lib/trpc', () => ({
  trpc: {
    outcome: {
      getByStudent: {
        useQuery: () => ({
          data: mockSummaryData,
          isLoading: false,
          isError: false,
        }),
      },
    },
  },
}))

describe('FundingSummary Component - Story 5.1', () => {
  describe('AC5: Dashboard Summary Display', () => {
    it('should display success metrics title', () => {
      render(<FundingSummary />)

      expect(screen.getByText(/Success Metrics/i)).toBeInTheDocument()
    })

    it('should display total awards count', () => {
      render(<FundingSummary />)

      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText(/Awards/i)).toBeInTheDocument()
    })

    it('should display total denials count', () => {
      render(<FundingSummary />)

      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText(/Denials/i)).toBeInTheDocument()
    })

    it('should display total pending count', () => {
      render(<FundingSummary />)

      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText(/Pending/i)).toBeInTheDocument()
    })

    it('should display success rate percentage', () => {
      render(<FundingSummary />)

      expect(screen.getByText('60%')).toBeInTheDocument()
      expect(screen.getByText(/Success Rate/i)).toBeInTheDocument()
    })

    it('should display total funding secured', () => {
      render(<FundingSummary />)

      expect(screen.getByText(/\$8,000/i)).toBeInTheDocument()
      expect(screen.getByText(/Total Funding Secured/i)).toBeInTheDocument()
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
      vi.mock('@/shared/lib/trpc', () => ({
        trpc: {
          outcome: {
            getByStudent: {
              useQuery: () => ({
                data: undefined,
                isLoading: true,
                isError: false,
              }),
            },
          },
        },
      }))

      render(<FundingSummary />)

      expect(screen.getByText(/Success Metrics/i)).toBeInTheDocument()
    })
  })
})
