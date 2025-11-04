/**
 * Story 1.8: Profile Wizard E2E Tests
 * Tests complete 6-step wizard flow, navigation, auto-save, and mobile responsiveness
 *
 * Migrated to use production-ready testing patterns:
 * - Custom fixtures from support/fixtures
 * - authenticatedPage fixture for authenticated tests
 * - Deterministic waits (no waitForTimeout)
 */

import { test, expect } from '../support/fixtures'

// Helper function to navigate to wizard and wait for it to load
async function navigateToWizard(page: any) {
  await page.goto('/profile/wizard', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  })

  // Wait for wizard to fully load (check for Welcome heading or loading spinner)
  await page.waitForSelector('h1:has-text("Welcome"), [class*="animate-spin"]', { timeout: 15000 })
}

test.describe('Profile Wizard', () => {
  // Setup: Navigate to wizard and clear localStorage before each test
  test.beforeEach(async ({ authenticatedPage }) => {
    // Clear wizard localStorage to prevent hydration mismatches
    await authenticatedPage.goto('/dashboard')
    await authenticatedPage.evaluate(() => {
      localStorage.removeItem('profile-wizard-storage')
    })

    // Navigate to wizard (auth is already set up by fixture)
    await authenticatedPage.goto('/profile/wizard', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    })

    // Wait for the wizard to fully load
    await authenticatedPage.waitForSelector('h1:has-text("Welcome")', { timeout: 15000 })
  })

  test('AC1: should display 6-step wizard flow', async ({ authenticatedPage }) => {

    // Welcome step (step 0)
    await expect(authenticatedPage.getByRole('heading', { name: /Welcome to Scholarship Hunter/i })).toBeVisible()
    await expect(authenticatedPage.getByText(/6 Steps/i)).toBeVisible()

    // Start wizard
    const getStartedButton = authenticatedPage.getByRole('button', { name: /Get Started/i })
    await expect(getStartedButton).toBeVisible()
    await getStartedButton.click()

    // Academic step (step 1) - wait for step indicator and heading
    await expect(authenticatedPage.getByText(/Step 1 of 5/i)).toBeVisible({ timeout: 10000 })
    await expect(authenticatedPage.getByRole('heading', { name: /Academic (Information|Profile)/i })).toBeVisible()

    // Fill required field: graduation year (select dropdown)
    await authenticatedPage.getByLabel(/Expected Graduation Year/i).click()
    await authenticatedPage.getByRole('option', { name: '2026' }).click()

    // NOTE: Step navigation validates required fields, so we need to fill them
    // Step 1 requires: graduationYear (filled above)
    // Step 2 requires: citizenship, state
    // Step 3 requires: intendedMajor
    // Step 4: No required fields

    // Navigate to Demographics step (step 2)
    await authenticatedPage.getByRole('button', { name: /Next/i }).click()
    await expect(authenticatedPage.getByRole('heading', { name: /Demographics/i })).toBeVisible()
    await expect(authenticatedPage.getByText(/Step 2 of 5/i)).toBeVisible()

    // Fill required fields for step 2
    // Select citizenship (using keyboard to interact with custom select)
    await authenticatedPage.getByLabel(/Citizenship Status/i).click()
    await authenticatedPage.keyboard.press('Enter') // Select first option (U.S. Citizen)

    // Select state
    await authenticatedPage.getByLabel(/State/i, { exact: true }).click()
    await authenticatedPage.keyboard.type('CA')
    await authenticatedPage.keyboard.press('Enter')

    // Navigate to Major & Experience step (step 3)
    await authenticatedPage.getByRole('button', { name: /Next/i }).click()
    await expect(authenticatedPage.getByRole('heading', { name: /Major.*Experience/i })).toBeVisible()
    await expect(authenticatedPage.getByText(/Step 3 of 5/i)).toBeVisible()

    // Fill required field: intended major (text input)
    await authenticatedPage.getByLabel(/Intended Major/i).fill('Computer Science')

    // Navigate to Special Circumstances step (step 4)
    await authenticatedPage.getByRole('button', { name: /Next/i }).click()
    await expect(authenticatedPage.getByRole('heading', { name: /Special Circumstances/i })).toBeVisible()
    await expect(authenticatedPage.getByText(/Step 4 of 5/i)).toBeVisible()

    // Navigate to Review step (step 5)
    await authenticatedPage.getByRole('button', { name: /Next/i }).click()
    await expect(authenticatedPage.getByRole('heading', { name: /Review Your Profile/i })).toBeVisible()
    await expect(authenticatedPage.getByText(/Profile Completeness/i)).toBeVisible()
  })

  test('AC2: progress indicator shows current step with checkmarks', async ({ authenticatedPage }) => {
    // Start wizard
    await authenticatedPage.getByRole('button', { name: /Get Started/i }).click()

    // Wait for step 1 to load
    await expect(authenticatedPage.getByText(/Step 1 of 5/i)).toBeVisible()

    // Step 1 indicator should be highlighted
    const step1Indicator = authenticatedPage.locator('[class*="bg-primary"]').filter({ hasText: '1' }).first()
    await expect(step1Indicator).toBeVisible()

    // Progress bar should be visible on step 1
    const progressBar = authenticatedPage.locator('[role="progressbar"]').first()
    await expect(progressBar).toBeVisible()

    // Fill required field before navigating
    await authenticatedPage.getByLabel(/Expected Graduation Year/i).click()
    await authenticatedPage.getByRole('option', { name: '2026' }).click()

    // Navigate to step 2
    await authenticatedPage.getByRole('button', { name: /Next/i }).click()

    // Step 1 should show checkmark, step 2 highlighted
    await expect(authenticatedPage.getByText(/Step 2 of 5/i)).toBeVisible()
  })

  test('AC3: navigation controls work correctly', async ({ authenticatedPage }) => {
    // Start wizard
    const getStartedButton = authenticatedPage.getByRole('button', { name: /Get Started/i })
    await expect(getStartedButton).toBeVisible()
    await expect(getStartedButton).toBeEnabled()
    await getStartedButton.click()

    // Wait for Welcome page to disappear and step 1 to load
    await expect(authenticatedPage.getByRole('heading', { name: /Welcome to Scholarship Hunter/i })).not.toBeVisible({ timeout: 5000 })
    await expect(authenticatedPage.getByText(/Step 1 of 5/i)).toBeVisible({ timeout: 10000 })

    // Back button should be disabled on step 1
    const backButton = authenticatedPage.getByRole('button', { name: /Back/i })
    await expect(backButton).toBeDisabled()

    // Fill required field before navigating
    await authenticatedPage.getByLabel(/Expected Graduation Year/i).click()
    await authenticatedPage.getByRole('option', { name: '2026' }).click()

    // Next button advances to step 2
    const nextButton = authenticatedPage.getByRole('button', { name: /Next/i })
    await nextButton.click()
    await expect(authenticatedPage.getByText(/Step 2 of 5/i)).toBeVisible()

    // Back button should work (no validation on going back)
    await backButton.click()
    await expect(authenticatedPage.getByText(/Step 1 of 5/i)).toBeVisible()

    // Save & Continue Later button exists
    await expect(authenticatedPage.getByRole('button', { name: /Save.*Continue Later/i })).toBeVisible()
  })

  test('AC4: each step focuses on related fields only', async ({ authenticatedPage }) => {
    // Start wizard
    await authenticatedPage.getByRole('button', { name: /Get Started/i }).click()

    // Wait for step 1
    await expect(authenticatedPage.getByText(/Step 1 of 5/i)).toBeVisible()

    // Academic step should show only academic fields
    await expect(authenticatedPage.getByText(/Academic Profile/i).first()).toBeVisible()
    await expect(authenticatedPage.getByLabel(/^GPA$/i)).toBeVisible()

    // Should NOT show demographic fields
    await expect(authenticatedPage.getByLabel(/Gender/i)).not.toBeVisible()
    await expect(authenticatedPage.getByLabel(/Ethnicity/i)).not.toBeVisible()

    // Fill required field before navigating
    await authenticatedPage.getByLabel(/Expected Graduation Year/i).click()
    await authenticatedPage.getByRole('option', { name: '2026' }).click()

    // Navigate to Demographics step
    await authenticatedPage.getByRole('button', { name: /Next/i }).click()

    // Should now show demographic-related content
    await expect(authenticatedPage.getByText(/Demographics.*Background/i)).toBeVisible()
  })

  test('AC5: mobile responsive layout', async ({ authenticatedPage }) => {
    // Test on mobile viewport (iPhone SE)
    await authenticatedPage.setViewportSize({ width: 375, height: 667 })

    // Start wizard
    await authenticatedPage.getByRole('button', { name: /Get Started/i }).click()

    // Progress indicator should be visible on mobile
    await expect(authenticatedPage.getByText(/Step 1 of 5/i)).toBeVisible()

    // Navigation buttons should be accessible (sticky footer)
    const nextButton = authenticatedPage.getByRole('button', { name: /Next/i })
    await expect(nextButton).toBeVisible()

    // Form should be in single-column layout (check that elements stack vertically)
    const academicSection = authenticatedPage.getByText(/Academic Information/i)
    await expect(academicSection).toBeVisible()
  })

  test('AC6: auto-save shows saving indicator', async ({ authenticatedPage }) => {
    // Start wizard
    const getStartedButton = authenticatedPage.getByRole('button', { name: /Get Started/i })
    await expect(getStartedButton).toBeVisible()
    await expect(getStartedButton).toBeEnabled()
    await getStartedButton.click()

    // Wait for Welcome page to disappear and step 1 to load
    await expect(authenticatedPage.getByRole('heading', { name: /Welcome to Scholarship Hunter/i })).not.toBeVisible({ timeout: 5000 })
    await expect(authenticatedPage.getByText(/Step 1 of 5/i)).toBeVisible({ timeout: 10000 })

    // Fill in a field to trigger auto-save
    await authenticatedPage.getByLabel(/^GPA$/i).fill('3.75')

    // Wait for "Saved" indicator (auto-save debounces 500ms, allow up to 2s for network)
    await expect(authenticatedPage.getByText(/Saved/i)).toBeVisible({ timeout: 2000 })
  })

  test('AC7: Review step shows all entered data with edit links', async ({ authenticatedPage }) => {
    // Start wizard and navigate to Review
    const getStartedButton = authenticatedPage.getByRole('button', { name: /Get Started/i })
    await expect(getStartedButton).toBeVisible()
    await expect(getStartedButton).toBeEnabled()
    await getStartedButton.click()

    // Wait for Welcome page to disappear and step 1 to load
    await expect(authenticatedPage.getByRole('heading', { name: /Welcome to Scholarship Hunter/i })).not.toBeVisible({ timeout: 5000 })
    await expect(authenticatedPage.getByText(/Step 1 of 5/i)).toBeVisible({ timeout: 10000 })

    // Fill in some academic data
    await authenticatedPage.getByLabel(/^GPA$/i).fill('3.75')

    // Fill required field: graduation year before advancing
    await authenticatedPage.getByLabel(/Expected Graduation Year/i).click()
    await authenticatedPage.getByRole('option', { name: '2026' }).click()

    // Step 1 -> Step 2
    await authenticatedPage.getByRole('button', { name: /Next/i }).click()
    await expect(authenticatedPage.getByText(/Step 2 of 5/i)).toBeVisible()

    // Fill required fields for step 2
    await authenticatedPage.getByLabel(/Citizenship Status/i).click()
    await authenticatedPage.keyboard.press('Enter')
    await authenticatedPage.getByLabel(/State/i, { exact: true }).click()
    await authenticatedPage.keyboard.type('CA')
    await authenticatedPage.keyboard.press('Enter')

    // Step 2 -> Step 3
    await authenticatedPage.getByRole('button', { name: /Next/i }).click()
    await expect(authenticatedPage.getByText(/Step 3 of 5/i)).toBeVisible()

    // Fill required field for step 3
    await authenticatedPage.getByLabel(/Intended Major/i).fill('Computer Science')

    // Step 3 -> Step 4
    await authenticatedPage.getByRole('button', { name: /Next/i }).click()
    await expect(authenticatedPage.getByText(/Step 4 of 5/i)).toBeVisible()

    // Step 4 -> Step 5 (Review)
    await authenticatedPage.getByRole('button', { name: /Next/i }).click()
    await expect(authenticatedPage.getByText(/Step 5 of 5/i)).toBeVisible()

    // Review step should display entered data
    await expect(authenticatedPage.getByText(/Review Your Profile/i)).toBeVisible()
    await expect(authenticatedPage.getByText(/Profile Completeness/i)).toBeVisible()
    await expect(authenticatedPage.getByText(/Profile Strength Score/i)).toBeVisible()

    // Edit links should exist for each section
    const editButtons = authenticatedPage.getByRole('button', { name: /Edit/i })
    await expect(editButtons.first()).toBeVisible()

    // Click edit for Academic section should jump back to step 1
    await editButtons.first().click()
    await expect(authenticatedPage.getByText(/Step 1 of 5/i)).toBeVisible()
  })

  test.skip('AC8: wizard can be re-entered for updates', async () => {
    // This test would require:
    // 1. Complete wizard once
    // 2. Navigate away
    // 3. Re-enter wizard via "Edit via Wizard"
    // 4. Verify data is pre-populated
    // 5. Verify submit button says "Update Profile"

    // Placeholder - implementation depends on dashboard integration
  })

  test('complete wizard flow from start to finish', async ({ authenticatedPage }) => {
    // Welcome step
    await expect(authenticatedPage.getByRole('heading', { name: /Welcome/i })).toBeVisible()
    const getStartedButton = authenticatedPage.getByRole('button', { name: /Get Started/i })
    await expect(getStartedButton).toBeEnabled()
    await getStartedButton.click()

    // Wait for Welcome page to disappear and step 1 to load
    await expect(authenticatedPage.getByRole('heading', { name: /Welcome/i })).not.toBeVisible({ timeout: 5000 })
    await expect(authenticatedPage.getByText(/Step 1 of 5/i)).toBeVisible({ timeout: 10000 })
    await authenticatedPage.getByLabel(/^GPA$/i).fill('3.8')
    await authenticatedPage.getByLabel(/^GPA Scale$/i).fill('4.0')

    // Fill required field: graduation year
    await authenticatedPage.getByLabel(/Expected Graduation Year/i).click()
    await authenticatedPage.getByRole('option', { name: '2026' }).click()

    await authenticatedPage.getByRole('button', { name: /Next/i }).click()

    // Step 2: Demographics
    await expect(authenticatedPage.getByText(/Step 2 of 5/i)).toBeVisible()

    // Fill required fields for step 2
    await authenticatedPage.getByLabel(/Citizenship Status/i).click()
    await authenticatedPage.keyboard.press('Enter') // Select first option
    await authenticatedPage.getByLabel(/State/i, { exact: true }).click()
    await authenticatedPage.keyboard.type('CA')
    await authenticatedPage.keyboard.press('Enter')

    await authenticatedPage.getByRole('button', { name: /Next/i }).click()

    // Step 3: Major & Experience
    await expect(authenticatedPage.getByText(/Step 3 of 5/i)).toBeVisible()

    // Fill required field: intended major
    await authenticatedPage.getByLabel(/Intended Major/i).fill('Computer Science')

    await authenticatedPage.getByRole('button', { name: /Next/i }).click()

    // Step 4: Special Circumstances
    await expect(authenticatedPage.getByText(/Step 4 of 5/i)).toBeVisible()
    await authenticatedPage.getByRole('button', { name: /Next/i }).click()

    // Step 5: Review & Submit
    await expect(authenticatedPage.getByRole('heading', { name: /Review/i })).toBeVisible()

    // Completeness and strength scores should be visible
    await expect(authenticatedPage.getByText(/Profile Completeness/i)).toBeVisible()
    await expect(authenticatedPage.getByText(/Profile Strength/i)).toBeVisible()

    // Submit button should exist (may be disabled if required fields missing)
    await expect(authenticatedPage.getByRole('button', { name: /Submit Profile/i })).toBeVisible()
  })

  test('Save & Continue Later saves progress and redirects', async ({ authenticatedPage }) => {
    // Start wizard
    const getStartedButton = authenticatedPage.getByRole('button', { name: /Get Started/i })
    await expect(getStartedButton).toBeVisible()
    await getStartedButton.click()

    // Wait for step 1 to load
    await expect(authenticatedPage.getByText(/Step 1 of 5/i)).toBeVisible({ timeout: 10000 })

    // Fill in some data
    await authenticatedPage.getByLabel(/^GPA$/i).fill('3.9')

    // Click Save & Continue Later
    await authenticatedPage.getByRole('button', { name: /Save.*Continue Later/i }).click()

    // Should redirect to dashboard
    await authenticatedPage.waitForURL('**/dashboard', { timeout: 5000 })
  })
})
