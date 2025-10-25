import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardWelcome } from '@/modules/dashboard/components/DashboardWelcome'

describe('DashboardWelcome Component', () => {
  beforeEach(() => {
    // Mock the current time for consistent testing
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('displays morning greeting between 5am and 12pm', () => {
    // Set time to 10am
    vi.setSystemTime(new Date(2024, 0, 1, 10, 0, 0))

    render(
      <DashboardWelcome
        firstName="John"
        profileCompleteness={50}
        profileStrength={60}
      />
    )

    expect(screen.getByText(/Good morning, John!/i)).toBeInTheDocument()
  })

  it('displays afternoon greeting between 12pm and 5pm', () => {
    // Set time to 2pm
    vi.setSystemTime(new Date(2024, 0, 1, 14, 0, 0))

    render(
      <DashboardWelcome
        firstName="Jane"
        profileCompleteness={75}
        profileStrength={80}
      />
    )

    expect(screen.getByText(/Good afternoon, Jane!/i)).toBeInTheDocument()
  })

  it('displays evening greeting between 5pm and 5am', () => {
    // Set time to 8pm
    vi.setSystemTime(new Date(2024, 0, 1, 20, 0, 0))

    render(
      <DashboardWelcome
        firstName="Bob"
        profileCompleteness={100}
        profileStrength={90}
      />
    )

    expect(screen.getByText(/Good evening, Bob!/i)).toBeInTheDocument()
  })

  it('displays motivational message based on profile completeness < 25%', () => {
    render(
      <DashboardWelcome
        firstName="Student"
        profileCompleteness={20}
        profileStrength={30}
      />
    )

    expect(screen.getByText(/Let's get started building your profile!/i)).toBeInTheDocument()
  })

  it('displays motivational message for profile completeness 25-75%', () => {
    render(
      <DashboardWelcome
        firstName="Student"
        profileCompleteness={50}
        profileStrength={60}
      />
    )

    expect(screen.getByText(/You're making great progress!/i)).toBeInTheDocument()
  })

  it('displays motivational message for profile completeness >= 75%', () => {
    render(
      <DashboardWelcome
        firstName="Student"
        profileCompleteness={80}
        profileStrength={85}
      />
    )

    expect(screen.getByText(/You're making great progress!/i)).toBeInTheDocument()
  })

  it('displays motivational message for 100% complete profile', () => {
    render(
      <DashboardWelcome
        firstName="Student"
        profileCompleteness={100}
        profileStrength={95}
      />
    )

    expect(screen.getByText(/Your profile is looking strong! Ready to find scholarships!/i)).toBeInTheDocument()
  })

  it('displays profile completeness percentage', () => {
    render(
      <DashboardWelcome
        firstName="Student"
        profileCompleteness={65}
        profileStrength={70}
      />
    )

    expect(screen.getByText('65%')).toBeInTheDocument()
    expect(screen.getByText(/Profile Completeness/i)).toBeInTheDocument()
  })

  it('displays profile strength score', () => {
    render(
      <DashboardWelcome
        firstName="Student"
        profileCompleteness={80}
        profileStrength={75}
      />
    )

    expect(screen.getByText('75')).toBeInTheDocument()
    expect(screen.getByText(/Profile Strength/i)).toBeInTheDocument()
  })

  it('shows "Complete" badge when profile is 100%', () => {
    render(
      <DashboardWelcome
        firstName="Student"
        profileCompleteness={100}
        profileStrength={90}
      />
    )

    expect(screen.getByText(/Complete/i)).toBeInTheDocument()
  })

  it('shows "Strong" badge when strength >= 80', () => {
    render(
      <DashboardWelcome
        firstName="Student"
        profileCompleteness={100}
        profileStrength={85}
      />
    )

    expect(screen.getByText(/Strong/i)).toBeInTheDocument()
  })

  it('shows "Good" badge when strength 60-79', () => {
    render(
      <DashboardWelcome
        firstName="Student"
        profileCompleteness={80}
        profileStrength={70}
      />
    )

    expect(screen.getByText(/Good/i)).toBeInTheDocument()
  })

  it('shows placeholder data for scholarships and applications', () => {
    render(
      <DashboardWelcome
        firstName="Student"
        profileCompleteness={50}
        profileStrength={60}
        scholarshipsMatched={0}
        applicationsInProgress={0}
      />
    )

    expect(screen.getByText(/Scholarships Matched/i)).toBeInTheDocument()
    expect(screen.getByText(/Applications/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Coming Soon/i).length).toBeGreaterThan(0)
  })

  it('uses default "Student" name if firstName not provided', () => {
    vi.setSystemTime(new Date(2024, 0, 1, 10, 0, 0))

    render(
      <DashboardWelcome
        profileCompleteness={50}
        profileStrength={60}
      />
    )

    expect(screen.getByText(/Good morning, Student!/i)).toBeInTheDocument()
  })
})
