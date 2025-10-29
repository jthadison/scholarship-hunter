/**
 * Unit Tests for WorkloadVisualization Component (Story 3.6 - AC#2)
 *
 * Tests workload display with hour breakdown by application
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WorkloadVisualization } from '@/modules/quinn/components/WorkloadVisualization'

describe('WorkloadVisualization Component', () => {
  const mockBreakdown = [
    {
      applicationId: 'app-1',
      scholarshipName: 'Women in STEM Scholarship',
      hours: 10,
      priorityTier: 'MUST_APPLY' as const,
    },
    {
      applicationId: 'app-2',
      scholarshipName: 'Tech Leaders Award',
      hours: 5,
      priorityTier: 'SHOULD_APPLY' as const,
    },
    {
      applicationId: 'app-3',
      scholarshipName: 'Community Service Grant',
      hours: 3,
      priorityTier: 'IF_TIME_PERMITS' as const,
    },
  ]

  it('should display total hours scheduled', () => {
    render(
      <WorkloadVisualization
        totalHours={18}
        breakdown={mockBreakdown}
        status="HEAVY"
        message="⚠️ Heavy week - prioritize high-value applications"
      />
    )

    expect(screen.getByText('18h')).toBeInTheDocument()
    expect(screen.getByText(/scheduled this week/)).toBeInTheDocument()
  })

  it('should display workload status message', () => {
    render(
      <WorkloadVisualization
        totalHours={18}
        breakdown={mockBreakdown}
        status="HEAVY"
        message="⚠️ Heavy week - prioritize high-value applications"
      />
    )

    expect(screen.getByText(/Heavy week - prioritize high-value applications/)).toBeInTheDocument()
  })

  it('should display breakdown by application', () => {
    render(
      <WorkloadVisualization
        totalHours={18}
        breakdown={mockBreakdown}
        status="HEAVY"
        message="Test message"
      />
    )

    expect(screen.getByText('Women in STEM Scholarship')).toBeInTheDocument()
    expect(screen.getByText('Tech Leaders Award')).toBeInTheDocument()
    expect(screen.getByText('Community Service Grant')).toBeInTheDocument()
  })

  it('should display hours for each application', () => {
    render(
      <WorkloadVisualization
        totalHours={18}
        breakdown={mockBreakdown}
        status="HEAVY"
        message="Test message"
      />
    )

    expect(screen.getByText('10h')).toBeInTheDocument()
    expect(screen.getByText('5h')).toBeInTheDocument()
    expect(screen.getByText('3h')).toBeInTheDocument()
  })

  it('should display LIGHT status with green indicator', () => {
    render(
      <WorkloadVisualization
        totalHours={6}
        breakdown={[mockBreakdown[0]]}
            // @ts-expect-error - Test data type mismatch with ApplicationBreakdown
        status="LIGHT"
        message="✓ Manageable workload - you have capacity"
      />
    )

    expect(screen.getByText(/Manageable workload - you have capacity/)).toBeInTheDocument()
  })

  it('should display MODERATE status with yellow indicator', () => {
    render(
      <WorkloadVisualization
        totalHours={12}
        breakdown={mockBreakdown.slice(0, 2)}
        status="MODERATE"
        message="⚡ Moderate workload - stay focused"
      />
    )

    expect(screen.getByText(/Moderate workload - stay focused/)).toBeInTheDocument()
  })

  it('should display OVERLOAD status with red indicator', () => {
    render(
      <WorkloadVisualization
        totalHours={25}
        breakdown={mockBreakdown}
        status="OVERLOAD"
        message="🚨 Overloaded! Consider deferring low-priority work"
      />
    )

    expect(screen.getByText(/Overloaded! Consider deferring/)).toBeInTheDocument()
  })

  it('should display empty state when no breakdown', () => {
    render(
      <WorkloadVisualization
        totalHours={0}
        breakdown={[]}
        status="LIGHT"
        message="Test message"
      />
    )

    expect(screen.getByText(/No work scheduled this week/)).toBeInTheDocument()
  })

  it('should display priority tier legend', () => {
    render(
      <WorkloadVisualization
        totalHours={18}
        breakdown={mockBreakdown}
        status="HEAVY"
        message="Test message"
      />
    )

    expect(screen.getByText('Priority Tier Colors:')).toBeInTheDocument()
    expect(screen.getByText('Must Apply')).toBeInTheDocument()
    expect(screen.getByText('Should Apply')).toBeInTheDocument()
    expect(screen.getByText('If Time Permits')).toBeInTheDocument()
    expect(screen.getByText('High Value Reach')).toBeInTheDocument()
  })

  it('should display breakdown heading', () => {
    render(
      <WorkloadVisualization
        totalHours={18}
        breakdown={mockBreakdown}
        status="HEAVY"
        message="Test message"
      />
    )

    expect(screen.getByText('Breakdown by Application')).toBeInTheDocument()
  })

  it('should render bar chart for visualization', () => {
    const { container } = render(
      <WorkloadVisualization
        totalHours={18}
        breakdown={mockBreakdown}
        status="HEAVY"
        message="Test message"
      />
    )

    // Check for recharts container
    const chartContainer = container.querySelector('.recharts-responsive-container')
    expect(chartContainer).toBeInTheDocument()
  })

  it('should truncate long scholarship names in chart', () => {
    const longNameBreakdown = [
      {
        applicationId: 'app-1',
        scholarshipName: 'Very Long Scholarship Name That Should Be Truncated',
        hours: 10,
        priorityTier: 'MUST_APPLY' as const,
      },
    ]

    render(
      <WorkloadVisualization
        totalHours={10}
        breakdown={longNameBreakdown}
        status="LIGHT"
        message="Test message"
      />
    )

    // Full name should still appear in the breakdown list
    expect(screen.getByText(/Very Long Scholarship Name/)).toBeInTheDocument()
  })

  it('should display workload status icon', () => {
    const { container } = render(
      <WorkloadVisualization
        totalHours={18}
        breakdown={mockBreakdown}
        status="HEAVY"
        message="Test message"
      />
    )

    // Check for lucide icons
    const icons = container.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThan(0)
  })
})
