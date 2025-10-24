import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AcademicProfileForm } from '@/modules/profile/components/AcademicProfileForm'
import { DemographicProfileForm } from '@/modules/profile/components/DemographicProfileForm'
import { FinancialNeedForm } from '@/modules/profile/components/FinancialNeedForm'
import { ProfileProgressIndicator } from '@/modules/profile/components/ProfileProgressIndicator'
import { FinancialNeed } from '@prisma/client'

describe('Academic Profile Form', () => {
  it('should render academic form fields', () => {
    const mockSubmit = vi.fn()
    render(<AcademicProfileForm onSubmit={mockSubmit} />)

    // Check for key form sections
    expect(screen.getByText(/Academic Performance/i)).toBeInTheDocument()
    expect(screen.getByText(/Test Scores/i)).toBeInTheDocument()
    expect(screen.getByText(/Class Standing/i)).toBeInTheDocument()
    expect(screen.getByText(/Academic Timeline/i)).toBeInTheDocument()
  })

  it('should render GPA input with help text', () => {
    const mockSubmit = vi.fn()
    render(<AcademicProfileForm onSubmit={mockSubmit} />)

    // Check for help text instead of exact label match
    expect(
      screen.getByText(/Enter your cumulative GPA/i)
    ).toBeInTheDocument()
  })

  it('should render SAT and ACT score inputs', () => {
    const mockSubmit = vi.fn()
    render(<AcademicProfileForm onSubmit={mockSubmit} />)

    // Check for contextual help text
    expect(
      screen.getByText(/You only need SAT or ACT, not both/i)
    ).toBeInTheDocument()
  })
})

describe('Demographic Profile Form', () => {
  it('should render demographic form sections', () => {
    const mockSubmit = vi.fn()
    const { container } = render(<DemographicProfileForm onSubmit={mockSubmit} />)

    // Use getAllByText for headings that might appear multiple times
    expect(screen.getAllByText(/Personal Information/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Location/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Citizenship Status/i).length).toBeGreaterThan(0)
  })

  it('should render gender input as optional', () => {
    const mockSubmit = vi.fn()
    render(<DemographicProfileForm onSubmit={mockSubmit} />)

    // Check for unique contextual help text
    expect(screen.getByText(/helps match you with relevant scholarships/i)).toBeInTheDocument()
  })

  it('should render ethnicity checkboxes', () => {
    const mockSubmit = vi.fn()
    render(<DemographicProfileForm onSubmit={mockSubmit} />)

    expect(screen.getByText(/Select all that apply/i)).toBeInTheDocument()
    // Check for multiple ethnicity options (these appear as text in labels)
    expect(screen.getAllByText(/Asian/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Black\/African American/i).length).toBeGreaterThan(0)
  })

  it('should render state selector', () => {
    const mockSubmit = vi.fn()
    render(<DemographicProfileForm onSubmit={mockSubmit} />)

    expect(screen.getByText(/Many scholarships have state residency requirements/i)).toBeInTheDocument()
  })
})

describe('Financial Need Form', () => {
  it('should render financial need form sections', () => {
    const mockSubmit = vi.fn()
    render(<FinancialNeedForm onSubmit={mockSubmit} />)

    expect(screen.getByText(/Financial Need Assessment/i)).toBeInTheDocument()
    expect(screen.getByText(/Federal Aid Eligibility/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Expected Family Contribution \(EFC\)/i)
    ).toBeInTheDocument()
  })

  it('should render Pell Grant checkbox', () => {
    const mockSubmit = vi.fn()
    render(<FinancialNeedForm onSubmit={mockSubmit} />)

    expect(screen.getByText(/Pell Grant Eligible/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Check if you receive or expect to receive/i)
    ).toBeInTheDocument()
  })

  it('should render privacy notice', () => {
    const mockSubmit = vi.fn()
    render(<FinancialNeedForm onSubmit={mockSubmit} />)

    expect(
      screen.getByText(/All financial information is kept strictly confidential/i)
    ).toBeInTheDocument()
  })
})

describe('Profile Progress Indicator', () => {
  it('should display completion percentage', () => {
    render(
      <ProfileProgressIndicator
        completionPercentage={75}
        requiredFieldsComplete={4}
        requiredFieldsTotal={4}
        optionalFieldsComplete={8}
        optionalFieldsTotal={12}
        missingRequired={[]}
        missingRecommended={['GPA', 'SAT Score']}
      />
    )

    // Use getAllByText since 75% appears in multiple places (header + indicators)
    expect(screen.getAllByText(/75%/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Profile Completeness/i)).toBeInTheDocument()
  })

  it('should show missing required fields alert when fields are missing', () => {
    render(
      <ProfileProgressIndicator
        completionPercentage={30}
        requiredFieldsComplete={2}
        requiredFieldsTotal={4}
        optionalFieldsComplete={0}
        optionalFieldsTotal={12}
        missingRequired={['Citizenship Status', 'State']}
        missingRecommended={[]}
      />
    )

    expect(screen.getByText(/Required Fields Missing/i)).toBeInTheDocument()
    expect(screen.getByText(/Citizenship Status/i)).toBeInTheDocument()
    expect(screen.getByText(/State/i)).toBeInTheDocument()
  })

  it('should show recommended fields when only optional fields missing', () => {
    render(
      <ProfileProgressIndicator
        completionPercentage={70}
        requiredFieldsComplete={4}
        requiredFieldsTotal={4}
        optionalFieldsComplete={0}
        optionalFieldsTotal={12}
        missingRequired={[]}
        missingRecommended={['GPA', 'SAT Score', 'ACT Score']}
      />
    )

    expect(screen.getByText(/Recommended Fields/i)).toBeInTheDocument()
  })

  it('should show success message at 100% completion', () => {
    render(
      <ProfileProgressIndicator
        completionPercentage={100}
        requiredFieldsComplete={4}
        requiredFieldsTotal={4}
        optionalFieldsComplete={12}
        optionalFieldsTotal={12}
        missingRequired={[]}
        missingRecommended={[]}
      />
    )

    expect(screen.getByText(/Profile Complete!/i)).toBeInTheDocument()
    expect(
      screen.getByText(/ready to discover scholarships/i)
    ).toBeInTheDocument()
  })

  it('should display field completion counts', () => {
    render(
      <ProfileProgressIndicator
        completionPercentage={70}
        requiredFieldsComplete={3}
        requiredFieldsTotal={4}
        optionalFieldsComplete={5}
        optionalFieldsTotal={12}
        missingRequired={[]}
        missingRecommended={[]}
      />
    )

    expect(screen.getByText(/Required: 3\/4/i)).toBeInTheDocument()
    expect(screen.getByText(/Optional: 5\/12/i)).toBeInTheDocument()
  })
})
