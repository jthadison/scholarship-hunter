/**
 * Unit Tests for ConflictWarnings Component (Story 3.6 - AC#3)
 *
 * Tests conflict warning display when workload exceeds thresholds
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConflictWarnings } from '@/modules/quinn/components/ConflictWarnings'

describe('ConflictWarnings Component', () => {
  const mockConflictedWeeks = [
    {
      weekStart: new Date('2025-11-17'),
      weekEnd: new Date('2025-11-24'),
      totalHours: 22,
      applications: [
        {
          applicationId: 'app-1',
          scholarshipName: 'Women in STEM',
          priorityTier: 'MUST_APPLY' as const,
          estimatedHours: 10,
        },
        {
          applicationId: 'app-2',
          scholarshipName: 'Tech Leaders',
          priorityTier: 'SHOULD_APPLY' as const,
          estimatedHours: 8,
        },
        {
          applicationId: 'app-3',
          scholarshipName: 'Community Service',
          priorityTier: 'IF_TIME_PERMITS' as const,
          estimatedHours: 4,
        },
      ],
      warningMessage: 'Warning: 3 applications due same week',
    },
  ]

  it('should display no conflicts message when no conflicts', () => {
    render(
      <ConflictWarnings
        hasConflicts={false}
        conflictedWeeks={[]}
        totalConflictedApplications={0}
      />
    )

    expect(screen.getByText('No Conflicts Detected')).toBeInTheDocument()
    expect(screen.getByText(/Your schedule looks great!/)).toBeInTheDocument()
  })

  it('should display conflict warning when conflicts exist', () => {
    render(
      <ConflictWarnings
        hasConflicts={true}
        conflictedWeeks={mockConflictedWeeks}
        totalConflictedApplications={3}
      />
    )

    expect(screen.getByText('Workload Conflicts Detected')).toBeInTheDocument()
  })

  it('should display total conflicted weeks count', () => {
    render(
      <ConflictWarnings
        hasConflicts={true}
        conflictedWeeks={mockConflictedWeeks}
        totalConflictedApplications={3}
      />
    )

    expect(screen.getByText(/1 week has/)).toBeInTheDocument()
  })

  it('should display total applications affected', () => {
    render(
      <ConflictWarnings
        hasConflicts={true}
        conflictedWeeks={mockConflictedWeeks}
        totalConflictedApplications={3}
      />
    )

    expect(screen.getByText(/3 applications affected/)).toBeInTheDocument()
  })

  it('should use plural "weeks" for multiple conflicts', () => {
    const multipleWeeks = [
      ...mockConflictedWeeks,
      {
        ...mockConflictedWeeks[0],
        weekStart: new Date('2025-11-24'),
        weekNumber: 48,
      },
    ]

    render(
      <ConflictWarnings
        hasConflicts={true}
        conflictedWeeks={multipleWeeks}
        totalConflictedApplications={5}
      />
    )

    expect(screen.getByText(/2 weeks have/)).toBeInTheDocument()
  })

  it('should display week date range', () => {
    render(
      <ConflictWarnings
        hasConflicts={true}
        conflictedWeeks={mockConflictedWeeks}
        totalConflictedApplications={3}
      />
    )

    // Check that date information is displayed (format may vary)
    const dateElements = screen.getAllByText(/Nov/)
    expect(dateElements.length).toBeGreaterThan(0)
  })

  it('should display total hours for conflicted week', () => {
    render(
      <ConflictWarnings
        hasConflicts={true}
        conflictedWeeks={mockConflictedWeeks}
        totalConflictedApplications={3}
      />
    )

    expect(screen.getByText(/22 hours scheduled/)).toBeInTheDocument()
  })

  it('should display application count in conflict', () => {
    render(
      <ConflictWarnings
        hasConflicts={true}
        conflictedWeeks={mockConflictedWeeks}
        totalConflictedApplications={3}
      />
    )

    // "3 applications" appears multiple times (in summary and in week details)
    expect(screen.getAllByText(/3 applications/).length).toBeGreaterThan(0)
  })

  it('should display OVERLOADED badge', () => {
    render(
      <ConflictWarnings
        hasConflicts={true}
        conflictedWeeks={mockConflictedWeeks}
        totalConflictedApplications={3}
      />
    )

    expect(screen.getByText('OVERLOADED')).toBeInTheDocument()
  })

  it('should display application names', () => {
    render(
      <ConflictWarnings
        hasConflicts={true}
        conflictedWeeks={mockConflictedWeeks}
        totalConflictedApplications={3}
      />
    )

    expect(screen.getByText('Women in STEM')).toBeInTheDocument()
    expect(screen.getByText('Tech Leaders')).toBeInTheDocument()
    expect(screen.getByText('Community Service')).toBeInTheDocument()
  })

  it('should display hours for each application', () => {
    render(
      <ConflictWarnings
        hasConflicts={true}
        conflictedWeeks={mockConflictedWeeks}
        totalConflictedApplications={3}
      />
    )

    expect(screen.getByText('10h')).toBeInTheDocument()
    expect(screen.getByText('8h')).toBeInTheDocument()
    expect(screen.getByText('4h')).toBeInTheDocument()
  })

  it('should display recommendations section', () => {
    render(
      <ConflictWarnings
        hasConflicts={true}
        conflictedWeeks={mockConflictedWeeks}
        totalConflictedApplications={3}
      />
    )

    expect(screen.getByText(/💡 Recommendations:/)).toBeInTheDocument()
  })

  it('should display defer button for IF_TIME_PERMITS applications', () => {
    render(
      <ConflictWarnings
        hasConflicts={true}
        conflictedWeeks={mockConflictedWeeks}
        totalConflictedApplications={3}
        onDeferApplication={vi.fn()}
      />
    )

    // Should show defer button for IF_TIME_PERMITS app (Community Service)
    const deferButtons = screen.getAllByText('Defer')
    expect(deferButtons.length).toBeGreaterThan(0)
  })

  it('should call onDeferApplication when defer clicked', () => {
    const mockOnDefer = vi.fn()

    render(
      <ConflictWarnings
        hasConflicts={true}
        conflictedWeeks={mockConflictedWeeks}
        totalConflictedApplications={3}
        onDeferApplication={mockOnDefer}
      />
    )

    const deferButton = screen.getAllByText('Defer')[0]
    fireEvent.click(deferButton)

    expect(mockOnDefer).toHaveBeenCalledWith('app-3') // IF_TIME_PERMITS app
  })

  it('should display "View Full Calendar" button when handler provided', () => {
    render(
      <ConflictWarnings
        hasConflicts={true}
        conflictedWeeks={mockConflictedWeeks}
        totalConflictedApplications={3}
        onViewCalendar={vi.fn()}
      />
    )

    expect(screen.getByText('View Full Calendar')).toBeInTheDocument()
  })

  it('should call onViewCalendar when calendar button clicked', () => {
    const mockOnViewCalendar = vi.fn()

    render(
      <ConflictWarnings
        hasConflicts={true}
        conflictedWeeks={mockConflictedWeeks}
        totalConflictedApplications={3}
        onViewCalendar={mockOnViewCalendar}
      />
    )

    const calendarButton = screen.getByText('View Full Calendar')
    fireEvent.click(calendarButton)

    expect(mockOnViewCalendar).toHaveBeenCalled()
  })

  it('should display warning icon', () => {
    const { container } = render(
      <ConflictWarnings
        hasConflicts={true}
        conflictedWeeks={mockConflictedWeeks}
        totalConflictedApplications={3}
      />
    )

    const warningIcons = container.querySelectorAll('svg')
    expect(warningIcons.length).toBeGreaterThan(0)
  })

  it('should use orange theme for conflicts', () => {
    const { container } = render(
      <ConflictWarnings
        hasConflicts={true}
        conflictedWeeks={mockConflictedWeeks}
        totalConflictedApplications={3}
      />
    )

    const orangeElements = container.querySelectorAll('.text-orange-700')
    expect(orangeElements.length).toBeGreaterThan(0)
  })
})
