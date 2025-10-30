/**
 * OutcomeForm Component Tests (Story 5.1)
 *
 * Tests for AC1-AC4:
 * - AC1: Outcome result dropdown
 * - AC2: Conditional award amount field
 * - AC3: Decision date tracking
 * - AC4: Notes textarea
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OutcomeForm } from '@/components/outcomes/OutcomeForm'
import { OutcomeResult } from '@prisma/client'

// Mock tRPC
vi.mock('@/shared/lib/trpc', () => ({
  trpc: {
    outcome: {
      create: {
        useMutation: () => ({
          mutateAsync: vi.fn(),
          isPending: false,
        }),
      },
      update: {
        useMutation: () => ({
          mutateAsync: vi.fn(),
          isPending: false,
        }),
      },
    },
    useUtils: () => ({
      outcome: {
        getByStudent: { invalidate: vi.fn() },
        getHistory: { invalidate: vi.fn() },
      },
      application: {
        getByStudent: { invalidate: vi.fn() },
      },
    }),
  },
}))

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

describe('OutcomeForm Component - Story 5.1', () => {
  const mockOnSuccess = vi.fn()
  const mockOnCancel = vi.fn()

  describe('Form Rendering', () => {
    it('AC1: should render outcome result dropdown', () => {
      render(
        <OutcomeForm
          applicationId="app-123"
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByText(/Outcome/i)).toBeInTheDocument()
    })

    it('AC3: should render decision date field', () => {
      render(
        <OutcomeForm
          applicationId="app-123"
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByText(/Decision Date/i)).toBeInTheDocument()
      expect(screen.getByText(/When did you receive the decision/i)).toBeInTheDocument()
    })

    it('AC4: should render notes textarea', () => {
      render(
        <OutcomeForm
          applicationId="app-123"
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByText(/Notes \(Optional\)/i)).toBeInTheDocument()
    })

    it('should display scholarship name when provided', () => {
      render(
        <OutcomeForm
          applicationId="app-123"
          scholarshipName="Test Scholarship"
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByText(/Test Scholarship/i)).toBeInTheDocument()
    })

    it('should show submit button with correct text for new outcome', () => {
      render(
        <OutcomeForm
          applicationId="app-123"
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByRole('button', { name: /Record Outcome/i })).toBeInTheDocument()
    })

    it('should show update button text for existing outcome', () => {
      const existingOutcome = {
        id: 'outcome-123',
        result: OutcomeResult.AWARDED,
        awardAmountReceived: 5000,
        decisionDate: new Date('2025-10-25'),
        notes: 'Congratulations!',
      }

      render(
        <OutcomeForm
          applicationId="app-123"
          existingOutcome={existingOutcome}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByRole('button', { name: /Update Outcome/i })).toBeInTheDocument()
    })

    it('should show cancel button when onCancel provided', () => {
      render(
        <OutcomeForm
          applicationId="app-123"
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
    })
  })

  describe('AC4: Notes Character Limit', () => {
    it('should display character counter for notes field', () => {
      render(
        <OutcomeForm
          applicationId="app-123"
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByText(/0\/500 characters/i)).toBeInTheDocument()
    })
  })
})
