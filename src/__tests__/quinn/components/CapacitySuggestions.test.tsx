/**
 * Unit Tests for CapacitySuggestions Component (Story 3.6 - AC#4)
 *
 * Tests capacity suggestion display when student has available time
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CapacitySuggestions } from '@/modules/quinn/components/CapacitySuggestions'
import { addDays } from 'date-fns'

describe('CapacitySuggestions Component', () => {
  const mockSuggestedApplication = {
    applicationId: 'app-1',
    scholarshipName: 'Women in STEM Scholarship',
    awardAmount: 10000,
    deadline: addDays(new Date(), 30),
    priorityTier: 'MUST_APPLY' as const,
    matchScore: 92,
    estimatedHours: 12,
  }

  it('should not render when no capacity', () => {
    const { container } = render(
      <CapacitySuggestions
        hasCapacity={false}
        currentWeeklyHours={15}
        suggestedApplication={null}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('should display capacity message when available', () => {
    render(
      <CapacitySuggestions
        hasCapacity={true}
        currentWeeklyHours={6}
        suggestedApplication={mockSuggestedApplication}
      />
    )

    expect(screen.getByText(/You have capacity this week/)).toBeInTheDocument()
    expect(screen.getByText(/6 hours/)).toBeInTheDocument()
  })

  it('should display suggested scholarship name', () => {
    render(
      <CapacitySuggestions
        hasCapacity={true}
        currentWeeklyHours={6}
        suggestedApplication={mockSuggestedApplication}
      />
    )

    expect(screen.getByText('Women in STEM Scholarship')).toBeInTheDocument()
  })

  it('should display priority tier badge', () => {
    render(
      <CapacitySuggestions
        hasCapacity={true}
        currentWeeklyHours={6}
        suggestedApplication={mockSuggestedApplication}
      />
    )

    expect(screen.getByText('MUST APPLY')).toBeInTheDocument()
  })

  it('should display award amount', () => {
    render(
      <CapacitySuggestions
        hasCapacity={true}
        currentWeeklyHours={6}
        suggestedApplication={mockSuggestedApplication}
      />
    )

    expect(screen.getByText('$10,000')).toBeInTheDocument()
  })

  it('should display days until deadline', () => {
    render(
      <CapacitySuggestions
        hasCapacity={true}
        currentWeeklyHours={6}
        suggestedApplication={mockSuggestedApplication}
      />
    )

    // Use getAllByText since "X days" appears in multiple places
    expect(screen.getAllByText(/\d+ days/).length).toBeGreaterThan(0)
    expect(screen.getByText('Until Deadline')).toBeInTheDocument()
  })

  it('should display match score when available', () => {
    render(
      <CapacitySuggestions
        hasCapacity={true}
        currentWeeklyHours={6}
        suggestedApplication={mockSuggestedApplication}
      />
    )

    expect(screen.getByText('92')).toBeInTheDocument()
    expect(screen.getByText('Match')).toBeInTheDocument()
  })

  it('should display estimated hours', () => {
    render(
      <CapacitySuggestions
        hasCapacity={true}
        currentWeeklyHours={6}
        suggestedApplication={mockSuggestedApplication}
      />
    )

    expect(screen.getByText(/12 hours/)).toBeInTheDocument()
  })

  it('should display "Start This Application" button', () => {
    render(
      <CapacitySuggestions
        hasCapacity={true}
        currentWeeklyHours={6}
        suggestedApplication={mockSuggestedApplication}
        onStartApplication={vi.fn()}
      />
    )

    // Button text may be split by icon, use regex pattern
    expect(screen.getByText(/Start This Application/)).toBeInTheDocument()
  })

  it('should call onStartApplication when start button clicked', () => {
    const mockOnStart = vi.fn()

    render(
      <CapacitySuggestions
        hasCapacity={true}
        currentWeeklyHours={6}
        suggestedApplication={mockSuggestedApplication}
        onStartApplication={mockOnStart}
      />
    )

    const startButton = screen.getByText(/Start This Application/)
    fireEvent.click(startButton)

    expect(mockOnStart).toHaveBeenCalledWith('app-1')
  })

  it('should display "Not now" button', () => {
    render(
      <CapacitySuggestions
        hasCapacity={true}
        currentWeeklyHours={6}
        suggestedApplication={mockSuggestedApplication}
        onDismiss={vi.fn()}
      />
    )

    expect(screen.getByText('Not now')).toBeInTheDocument()
  })

  it('should call onDismiss when dismiss button clicked', () => {
    const mockOnDismiss = vi.fn()

    render(
      <CapacitySuggestions
        hasCapacity={true}
        currentWeeklyHours={6}
        suggestedApplication={mockSuggestedApplication}
        onDismiss={mockOnDismiss}
      />
    )

    const dismissButton = screen.getByText('Not now')
    fireEvent.click(dismissButton)

    expect(mockOnDismiss).toHaveBeenCalled()
  })

  it('should display reason for suggestion', () => {
    render(
      <CapacitySuggestions
        hasCapacity={true}
        currentWeeklyHours={6}
        suggestedApplication={mockSuggestedApplication}
      />
    )

    expect(screen.getByText(/Why we're suggesting this:/)).toBeInTheDocument()
  })

  it('should show "all caught up" message when no suggestions', () => {
    render(
      <CapacitySuggestions
        hasCapacity={true}
        currentWeeklyHours={6}
        suggestedApplication={null}
      />
    )

    expect(screen.getByText(/You're Ahead of Schedule!/)).toBeInTheDocument()
    expect(screen.getByText(/Great work!/)).toBeInTheDocument()
  })

  it('should display teal/cyan branding', () => {
    const { container } = render(
      <CapacitySuggestions
        hasCapacity={true}
        currentWeeklyHours={6}
        suggestedApplication={mockSuggestedApplication}
      />
    )

    const card = container.querySelector('.from-cyan-50')
    expect(card).toBeInTheDocument()
  })

  it('should handle SHOULD_APPLY tier', () => {
    const shouldApplyApp = {
      ...mockSuggestedApplication,
      priorityTier: 'SHOULD_APPLY' as const,
    }

    render(
      <CapacitySuggestions
        hasCapacity={true}
        currentWeeklyHours={6}
        suggestedApplication={shouldApplyApp}
      />
    )

    expect(screen.getByText('SHOULD APPLY')).toBeInTheDocument()
  })

  it('should handle IF_TIME_PERMITS tier', () => {
    const ifTimePermitsApp = {
      ...mockSuggestedApplication,
      priorityTier: 'IF_TIME_PERMITS' as const,
    }

    render(
      <CapacitySuggestions
        hasCapacity={true}
        currentWeeklyHours={6}
        suggestedApplication={ifTimePermitsApp}
      />
    )

    expect(screen.getByText('IF TIME PERMITS')).toBeInTheDocument()
  })
})
