/**
 * Unit Tests for ShelbyHeader Component
 *
 * Tests personalized greeting with match count
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ShelbyHeader } from '@/modules/shelby/components/ShelbyHeader'

describe('ShelbyHeader Component', () => {
  it('should display personalized greeting with student name', () => {
    render(<ShelbyHeader firstName="Sarah" totalMatches={47} />)

    expect(screen.getByText(/Hi Sarah!/)).toBeInTheDocument()
    expect(screen.getByText(/I'm Shelby, your scholarship scout/)).toBeInTheDocument()
  })

  it('should display total match count', () => {
    render(<ShelbyHeader firstName="John" totalMatches={47} />)

    expect(screen.getByText(/47/)).toBeInTheDocument()
    expect(screen.getByText(/scholarships matched to your profile/)).toBeInTheDocument()
  })

  it('should use singular "scholarship" for 1 match', () => {
    render(<ShelbyHeader firstName="Sarah" totalMatches={1} />)

    expect(screen.getByText(/1 scholarship matched to your profile/)).toBeInTheDocument()
  })

  it('should use plural "scholarships" for multiple matches', () => {
    render(<ShelbyHeader firstName="Sarah" totalMatches={10} />)

    expect(screen.getByText(/10 scholarships matched to your profile/)).toBeInTheDocument()
  })

  it('should display encouraging message when no matches', () => {
    render(<ShelbyHeader firstName="Sarah" totalMatches={0} />)

    expect(screen.getByText(/Let's find your scholarships!/)).toBeInTheDocument()
    expect(screen.getByText(/Complete your profile to see matched opportunities/)).toBeInTheDocument()
  })

  it('should display Shelby avatar', () => {
    const { container } = render(<ShelbyHeader firstName="Sarah" totalMatches={10} />)

    const avatar = container.querySelector('img')
    expect(avatar).toHaveAttribute('src', '/agents/shelby.png')
    expect(avatar).toHaveAttribute('alt', 'Shelby - Your Opportunity Scout')
  })

  it('should display fallback avatar text when image fails', () => {
    render(<ShelbyHeader firstName="Sarah" totalMatches={10} />)

    // Fallback text should be in DOM
    expect(screen.getByText('S')).toBeInTheDocument()
  })

  it('should display encouraging tone', () => {
    render(<ShelbyHeader firstName="Sarah" totalMatches={47} />)

    // Check for encouraging language
    expect(screen.getByText(/You've got this!/)).toBeInTheDocument()
  })
})
