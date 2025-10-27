/**
 * Unit Tests for StatCard Component
 *
 * Tests the StatCard component renders correctly with various inputs
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatCard } from '@/modules/shelby/components/StatCard'
import { Trophy } from 'lucide-react'

describe('StatCard Component', () => {
  it('should render label and numeric value', () => {
    render(<StatCard label="Total Scholarships" value={47} />)

    expect(screen.getByText('Total Scholarships')).toBeInTheDocument()
    expect(screen.getByText('47')).toBeInTheDocument()
  })

  it('should render label and string value', () => {
    render(<StatCard label="Potential Funding" value="$15,000" />)

    expect(screen.getByText('Potential Funding')).toBeInTheDocument()
    expect(screen.getByText('$15,000')).toBeInTheDocument()
  })

  it('should render with icon when provided', () => {
    render(<StatCard label="Test" value={100} icon={<Trophy data-testid="trophy-icon" />} />)

    expect(screen.getByTestId('trophy-icon')).toBeInTheDocument()
  })

  it('should render without icon when not provided', () => {
    render(<StatCard label="Test" value={100} />)

    // Should not have an icon element
    const icon = screen.queryByTestId('trophy-icon')
    expect(icon).not.toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(<StatCard label="Test" value={100} className="bg-orange-50" />)

    const card = container.querySelector('.bg-orange-50')
    expect(card).toBeInTheDocument()
  })

  it('should format large numbers correctly', () => {
    render(<StatCard label="Funding" value={15000} />)

    expect(screen.getByText('15000')).toBeInTheDocument()
  })

  it('should display zero value', () => {
    render(<StatCard label="Matches" value={0} />)

    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
