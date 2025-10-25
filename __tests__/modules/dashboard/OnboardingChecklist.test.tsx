import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OnboardingChecklist } from '@/modules/dashboard/components/OnboardingChecklist'

describe('OnboardingChecklist Component', () => {
  it('does not render when profile is complete and strength reviewed', () => {
    const { container } = render(
      <OnboardingChecklist
        profileCompleted={true}
        strengthReviewed={true}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('renders checklist when profile is incomplete', () => {
    render(
      <OnboardingChecklist
        profileCompleted={false}
        strengthReviewed={false}
      />
    )

    expect(screen.getByText(/Get Started/i)).toBeInTheDocument()
  })

  it('shows all checklist items', () => {
    render(
      <OnboardingChecklist
        profileCompleted={false}
        strengthReviewed={false}
      />
    )

    expect(screen.getByText(/Complete your profile/i)).toBeInTheDocument()
    expect(screen.getByText(/Review your strength score/i)).toBeInTheDocument()
    expect(screen.getByText(/Find scholarships/i)).toBeInTheDocument()
    expect(screen.getByText(/Submit applications/i)).toBeInTheDocument()
  })

  it('marks profile as completed when profileCompleted is true', () => {
    render(
      <OnboardingChecklist
        profileCompleted={true}
        strengthReviewed={false}
      />
    )

    const profileItem = screen.getByText(/Complete your profile/i)
    expect(profileItem).toHaveClass(/line-through/)
  })

  it('shows correct progress count (0/4)', () => {
    render(
      <OnboardingChecklist
        profileCompleted={false}
        strengthReviewed={false}
      />
    )

    expect(screen.getByText(/0 \/ 4/i)).toBeInTheDocument()
  })

  it('shows correct progress count (1/4) when profile completed', () => {
    render(
      <OnboardingChecklist
        profileCompleted={true}
        strengthReviewed={false}
      />
    )

    expect(screen.getByText(/1 \/ 4/i)).toBeInTheDocument()
  })

  it('shows correct progress count (2/4) when both completed', () => {
    render(
      <OnboardingChecklist
        profileCompleted={true}
        strengthReviewed={true}
      />
    )

    // Should not render at all when both are true
    expect(screen.queryByText(/Get Started/i)).not.toBeInTheDocument()
  })

  it('shows "Coming Soon" badge for disabled items', () => {
    render(
      <OnboardingChecklist
        profileCompleted={false}
        strengthReviewed={false}
      />
    )

    const comingSoonBadges = screen.getAllByText(/Coming Soon/i)
    // Should have 2 "Coming Soon" badges (Find scholarships, Submit applications)
    expect(comingSoonBadges.length).toBe(2)
  })

  it('shows Complete Your Profile button when profile not complete', () => {
    render(
      <OnboardingChecklist
        profileCompleted={false}
        strengthReviewed={false}
      />
    )

    const button = screen.getByRole('link', { name: /Complete Your Profile/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('href', '/profile/wizard')
  })

  it('does not show button when profile is complete', () => {
    render(
      <OnboardingChecklist
        profileCompleted={true}
        strengthReviewed={false}
      />
    )

    const button = screen.queryByRole('link', { name: /Complete Your Profile/i })
    expect(button).not.toBeInTheDocument()
  })
})
