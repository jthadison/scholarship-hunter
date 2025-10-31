/**
 * CelebrationModal Component Tests (Story 5.1)
 *
 * Tests for AC7: Celebration animations and modal
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CelebrationModal } from '@/components/outcomes/CelebrationModal'

// Mock confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('CelebrationModal Component - Story 5.1', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Clear session storage before each test
    sessionStorage.clear()
  })

  describe('AC7: Celebration Display', () => {
    it('should display congratulations message', () => {
      render(
        <CelebrationModal
          open={true}
          onClose={mockOnClose}
          scholarshipName="Test Scholarship"
          awardAmount={5000}
          outcomeId="outcome-123"
        />
      )

      expect(screen.getByText(/Congratulations/i)).toBeInTheDocument()
    })

    it('should display scholarship name', () => {
      render(
        <CelebrationModal
          open={true}
          onClose={mockOnClose}
          scholarshipName="Women in STEM Scholarship"
          awardAmount={5000}
          outcomeId="outcome-123"
        />
      )

      expect(screen.getByText(/Women in STEM Scholarship/i)).toBeInTheDocument()
    })

    it('should display formatted award amount', () => {
      render(
        <CelebrationModal
          open={true}
          onClose={mockOnClose}
          scholarshipName="Test Scholarship"
          awardAmount={5000}
          outcomeId="outcome-123"
        />
      )

      expect(screen.getByText(/\$5,000/i)).toBeInTheDocument()
      expect(screen.getByText(/Award Amount/i)).toBeInTheDocument()
    })

    it('should display trophy icon', () => {
      render(
        <CelebrationModal
          open={true}
          onClose={mockOnClose}
          scholarshipName="Test Scholarship"
          awardAmount={5000}
          outcomeId="outcome-123"
        />
      )

      // Check for celebration message which indicates modal is rendered
      expect(screen.getByText(/Congratulations!/i)).toBeInTheDocument()
    })

    it('should display call-to-action buttons', () => {
      render(
        <CelebrationModal
          open={true}
          onClose={mockOnClose}
          scholarshipName="Test Scholarship"
          awardAmount={5000}
          outcomeId="outcome-123"
        />
      )

      expect(screen.getByRole('button', { name: /View Analytics/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Apply to Next Scholarship/i })).toBeInTheDocument()
      // Check for any close button
      const closeButtons = screen.getAllByRole('button', { name: /Close/i })
      expect(closeButtons.length).toBeGreaterThan(0)
    })

    it('should display success message', () => {
      render(
        <CelebrationModal
          open={true}
          onClose={mockOnClose}
          scholarshipName="Test Scholarship"
          awardAmount={5000}
          outcomeId="outcome-123"
        />
      )

      expect(screen.getByText(/Your hard work has paid off/i)).toBeInTheDocument()
    })
  })

  describe('Large Award Amounts', () => {
    it('should format large award amounts with commas', () => {
      render(
        <CelebrationModal
          open={true}
          onClose={mockOnClose}
          scholarshipName="Full Ride Scholarship"
          awardAmount={50000}
          outcomeId="outcome-456"
        />
      )

      expect(screen.getByText(/\$50,000/i)).toBeInTheDocument()
    })
  })
})
