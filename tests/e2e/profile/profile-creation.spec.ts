/**
 * E2E Tests: Student Profile Creation - Academic & Demographics
 * Story 1.4: Profile Data Model - Academic & Demographics
 *
 * Test Strategy:
 * - E2E tests cover critical user journey (happy path)
 * - Uses Given-When-Then structure
 * - Network-first pattern (intercept before navigate)
 * - data-testid selectors for stability
 * - Custom fixtures for auth and data setup
 *
 * Coverage:
 * - AC1: Profile form captures GPA, test scores, class rank
 * - AC2: Demographic fields captured
 * - AC3: Financial need status selection
 * - AC6: Progress indicator shows completion percentage
 * - AC7: Contextual help text displayed
 */

import { test, expect } from '../../support/fixtures'

test.describe('Student Profile Creation - Complete Flow', () => {
  test('should complete profile with academic, demographic, and financial data', async ({
    authenticatedPage,
    userFactory,
  }) => {
    // GIVEN: Authenticated student user without profile
    const user = await userFactory.createUser({ withProfile: false })

    // WHEN: User navigates to profile creation page
    await authenticatedPage.goto('/profile/create')

    // THEN: Profile creation page loads with all form sections
    await expect(authenticatedPage.locator('[data-testid="profile-form"]')).toBeVisible()
    await expect(authenticatedPage.locator('[data-testid="academic-section"]')).toBeVisible()
    await expect(authenticatedPage.locator('[data-testid="demographic-section"]')).toBeVisible()
    await expect(authenticatedPage.locator('[data-testid="financial-section"]')).toBeVisible()

    // WHEN: User fills academic information
    await authenticatedPage.fill('[data-testid="gpa-input"]', '3.75')
    await authenticatedPage.selectOption('[data-testid="gpa-scale-select"]', '4.0')
    await authenticatedPage.fill('[data-testid="sat-score-input"]', '1450')
    await authenticatedPage.fill('[data-testid="act-score-input"]', '32')
    await authenticatedPage.fill('[data-testid="class-rank-input"]', '15')
    await authenticatedPage.fill('[data-testid="class-size-input"]', '300')
    await authenticatedPage.selectOption('[data-testid="graduation-year-select"]', String(new Date().getFullYear() + 1))
    await authenticatedPage.selectOption('[data-testid="current-grade-select"]', '12th')

    // THEN: Progress indicator updates after academic section
    const progressAfterAcademic = await authenticatedPage.locator('[data-testid="progress-percentage"]').textContent()
    expect(parseInt(progressAfterAcademic || '0')).toBeGreaterThan(0)

    // WHEN: User fills demographic information
    await authenticatedPage.selectOption('[data-testid="gender-select"]', 'Female')
    await authenticatedPage.check('[data-testid="ethnicity-hispanic"]')
    await authenticatedPage.selectOption('[data-testid="state-select"]', 'CA')
    await authenticatedPage.fill('[data-testid="city-input"]', 'Los Angeles')
    await authenticatedPage.fill('[data-testid="zipcode-input"]', '90001')
    await authenticatedPage.selectOption('[data-testid="citizenship-select"]', 'US Citizen')

    // THEN: Progress indicator increases
    const progressAfterDemographic = await authenticatedPage.locator('[data-testid="progress-percentage"]').textContent()
    expect(parseInt(progressAfterDemographic || '0')).toBeGreaterThan(parseInt(progressAfterAcademic || '0'))

    // WHEN: User fills financial need information
    await authenticatedPage.check('[data-testid="financial-need-high"]')
    await authenticatedPage.check('[data-testid="pell-grant-eligible"]')
    await authenticatedPage.selectOption('[data-testid="efc-range-select"]', '$0-$5,000')

    // THEN: Progress indicator shows near completion
    const progressFinal = await authenticatedPage.locator('[data-testid="progress-percentage"]').textContent()
    expect(parseInt(progressFinal || '0')).toBeGreaterThanOrEqual(80)

    // WHEN: User submits the profile form
    const profileCreatePromise = authenticatedPage.waitForResponse(
      (resp) => resp.url().includes('/api/trpc/profile.create') && resp.status() === 200
    )
    await authenticatedPage.click('[data-testid="submit-profile-button"]')

    // THEN: Profile is created successfully via API
    const response = await profileCreatePromise
    const responseData = await response.json()
    expect(responseData.result.data).toBeDefined()
    expect(responseData.result.data.gpa).toBe(3.75)
    expect(responseData.result.data.completionPercentage).toBeGreaterThanOrEqual(80)

    // THEN: User is redirected to dashboard with success message
    await authenticatedPage.waitForURL('**/dashboard**')
    await expect(authenticatedPage.locator('[data-testid="success-message"]'))
      .toContainText('Profile created successfully')

    // THEN: Profile progress indicator shows 100% complete
    await expect(authenticatedPage.locator('[data-testid="profile-progress"]'))
      .toContainText('100%')
  })
})

test.describe('Profile Form - Academic Section', () => {
  test('should display GPA input with contextual help text', async ({
    authenticatedPage,
    userFactory,
  }) => {
    // GIVEN: Authenticated student without profile
    await userFactory.createUser({ withProfile: false })

    // WHEN: User navigates to profile form
    await authenticatedPage.goto('/profile/create')

    // THEN: GPA input section is visible with help text
    await expect(authenticatedPage.locator('[data-testid="gpa-input"]')).toBeVisible()
    await expect(authenticatedPage.locator('[data-testid="gpa-help-text"]'))
      .toContainText('Enter your cumulative GPA')
  })

  test('should display test scores section with contextual help', async ({
    authenticatedPage,
    userFactory,
  }) => {
    // GIVEN: Authenticated student without profile
    await userFactory.createUser({ withProfile: false })

    // WHEN: User navigates to profile form
    await authenticatedPage.goto('/profile/create')

    // THEN: Test score inputs visible with help text
    await expect(authenticatedPage.locator('[data-testid="sat-score-input"]')).toBeVisible()
    await expect(authenticatedPage.locator('[data-testid="act-score-input"]')).toBeVisible()
    await expect(authenticatedPage.locator('[data-testid="test-scores-help-text"]'))
      .toContainText('You only need SAT or ACT, not both')
  })

  test('should display class rank section with contextual help', async ({
    authenticatedPage,
    userFactory,
  }) => {
    // GIVEN: Authenticated student without profile
    await userFactory.createUser({ withProfile: false })

    // WHEN: User navigates to profile form
    await authenticatedPage.goto('/profile/create')

    // THEN: Class rank inputs visible with help text
    await expect(authenticatedPage.locator('[data-testid="class-rank-input"]')).toBeVisible()
    await expect(authenticatedPage.locator('[data-testid="class-size-input"]')).toBeVisible()
    await expect(authenticatedPage.locator('[data-testid="class-rank-help-text"]'))
      .toContainText('Your class rank (e.g., 15 out of 300 students)')
  })
})

test.describe('Profile Form - Demographic Section', () => {
  test('should display ethnicity multi-select with contextual help', async ({
    authenticatedPage,
    userFactory,
  }) => {
    // GIVEN: Authenticated student without profile
    await userFactory.createUser({ withProfile: false })

    // WHEN: User navigates to profile form
    await authenticatedPage.goto('/profile/create')

    // THEN: Ethnicity checkboxes are visible
    await expect(authenticatedPage.locator('[data-testid="ethnicity-section"]')).toBeVisible()
    await expect(authenticatedPage.locator('[data-testid="ethnicity-asian"]')).toBeVisible()
    await expect(authenticatedPage.locator('[data-testid="ethnicity-black"]')).toBeVisible()
    await expect(authenticatedPage.locator('[data-testid="ethnicity-hispanic"]')).toBeVisible()

    // THEN: Contextual help is displayed
    await expect(authenticatedPage.locator('[data-testid="ethnicity-help-text"]'))
      .toContainText('Select all that apply')
  })

  test('should display location fields with validation', async ({
    authenticatedPage,
    userFactory,
  }) => {
    // GIVEN: Authenticated student without profile
    await userFactory.createUser({ withProfile: false })

    // WHEN: User navigates to profile form
    await authenticatedPage.goto('/profile/create')

    // THEN: Location fields are visible
    await expect(authenticatedPage.locator('[data-testid="state-select"]')).toBeVisible()
    await expect(authenticatedPage.locator('[data-testid="city-input"]')).toBeVisible()
    await expect(authenticatedPage.locator('[data-testid="zipcode-input"]')).toBeVisible()
  })

  test('should display citizenship field with help text', async ({
    authenticatedPage,
    userFactory,
  }) => {
    // GIVEN: Authenticated student without profile
    await userFactory.createUser({ withProfile: false })

    // WHEN: User navigates to profile form
    await authenticatedPage.goto('/profile/create')

    // THEN: Citizenship dropdown is visible with help
    await expect(authenticatedPage.locator('[data-testid="citizenship-select"]')).toBeVisible()
    await expect(authenticatedPage.locator('[data-testid="citizenship-help-text"]'))
      .toContainText('Many scholarships have citizenship requirements')
  })
})

test.describe('Profile Form - Financial Need Section', () => {
  test('should display financial need radio buttons with contextual help', async ({
    authenticatedPage,
    userFactory,
  }) => {
    // GIVEN: Authenticated student without profile
    await userFactory.createUser({ withProfile: false })

    // WHEN: User navigates to profile form
    await authenticatedPage.goto('/profile/create')

    // THEN: Financial need options are visible
    await expect(authenticatedPage.locator('[data-testid="financial-need-low"]')).toBeVisible()
    await expect(authenticatedPage.locator('[data-testid="financial-need-moderate"]')).toBeVisible()
    await expect(authenticatedPage.locator('[data-testid="financial-need-high"]')).toBeVisible()
    await expect(authenticatedPage.locator('[data-testid="financial-need-very-high"]')).toBeVisible()

    // THEN: Help text explains each level
    await expect(authenticatedPage.locator('[data-testid="financial-need-help-text"]'))
      .toBeVisible()
  })

  test('should display Pell Grant eligibility checkbox with help', async ({
    authenticatedPage,
    userFactory,
  }) => {
    // GIVEN: Authenticated student without profile
    await userFactory.createUser({ withProfile: false })

    // WHEN: User navigates to profile form
    await authenticatedPage.goto('/profile/create')

    // THEN: Pell Grant checkbox is visible with help text
    await expect(authenticatedPage.locator('[data-testid="pell-grant-eligible"]')).toBeVisible()
    await expect(authenticatedPage.locator('[data-testid="pell-grant-help-text"]'))
      .toContainText('Federal Pell Grant')
  })

  test('should display EFC range dropdown with help text', async ({
    authenticatedPage,
    userFactory,
  }) => {
    // GIVEN: Authenticated student without profile
    await userFactory.createUser({ withProfile: false })

    // WHEN: User navigates to profile form
    await authenticatedPage.goto('/profile/create')

    // THEN: EFC range selector is visible with help
    await expect(authenticatedPage.locator('[data-testid="efc-range-select"]')).toBeVisible()
    await expect(authenticatedPage.locator('[data-testid="efc-help-text"]'))
      .toContainText('Your EFC from FAFSA')
  })
})

test.describe('Profile Progress Indicator', () => {
  test('should display initial progress at 0%', async ({
    authenticatedPage,
    userFactory,
  }) => {
    // GIVEN: Authenticated student without profile
    await userFactory.createUser({ withProfile: false })

    // WHEN: User navigates to empty profile form
    await authenticatedPage.goto('/profile/create')

    // THEN: Progress indicator shows 0%
    await expect(authenticatedPage.locator('[data-testid="profile-progress-indicator"]')).toBeVisible()
    const progressText = await authenticatedPage.locator('[data-testid="progress-percentage"]').textContent()
    expect(progressText).toContain('0%')
  })

  test('should update progress in real-time as fields are filled', async ({
    authenticatedPage,
    userFactory,
  }) => {
    // GIVEN: Authenticated student without profile
    await userFactory.createUser({ withProfile: false })
    await authenticatedPage.goto('/profile/create')

    // WHEN: User fills GPA field
    await authenticatedPage.fill('[data-testid="gpa-input"]', '3.5')

    // THEN: Progress increases from 0%
    await authenticatedPage.waitForTimeout(500) // Debounce delay
    const progress1 = await authenticatedPage.locator('[data-testid="progress-percentage"]').textContent()
    expect(parseInt(progress1 || '0')).toBeGreaterThan(0)

    // WHEN: User fills additional fields
    await authenticatedPage.fill('[data-testid="sat-score-input"]', '1200')
    await authenticatedPage.selectOption('[data-testid="graduation-year-select"]', String(new Date().getFullYear() + 1))

    // THEN: Progress continues to increase
    await authenticatedPage.waitForTimeout(500)
    const progress2 = await authenticatedPage.locator('[data-testid="progress-percentage"]').textContent()
    expect(parseInt(progress2 || '0')).toBeGreaterThan(parseInt(progress1 || '0'))
  })

  test('should display progress bar with appropriate color coding', async ({
    authenticatedPage,
    userFactory,
  }) => {
    // GIVEN: Authenticated student with partial profile
    await userFactory.createUser({ withProfile: false })
    await authenticatedPage.goto('/profile/create')

    // WHEN: User fills some fields (50% complete)
    await authenticatedPage.fill('[data-testid="gpa-input"]', '3.5')
    await authenticatedPage.fill('[data-testid="sat-score-input"]', '1200')
    await authenticatedPage.selectOption('[data-testid="state-select"]', 'CA')

    // THEN: Progress bar has yellow/warning color (50-75%)
    await authenticatedPage.waitForTimeout(500)
    const progressBar = authenticatedPage.locator('[data-testid="progress-bar"]')
    await expect(progressBar).toHaveClass(/yellow|warning/)
  })
})
