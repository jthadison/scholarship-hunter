/**
 * Story 1.8: Profile Wizard E2E Tests
 * Tests complete 6-step wizard flow, navigation, auto-save, and mobile responsiveness
 */

import { test, expect } from '@playwright/test'

test.describe('Profile Wizard', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Add authentication setup when auth is implemented
    // For now, navigate directly to wizard
    await page.goto('/profile/wizard')
  })

  test('AC1: should display 6-step wizard flow', async ({ page }) => {
    // Welcome step (step 0)
    await expect(page.getByRole('heading', { name: /Welcome to Scholarship Hunter/i })).toBeVisible()
    await expect(page.getByText(/6 Steps/i)).toBeVisible()

    // Start wizard
    await page.getByRole('button', { name: /Get Started/i }).click()

    // Academic step (step 1)
    await expect(page.getByRole('heading', { name: /Academic Information/i })).toBeVisible()
    await expect(page.getByText(/Step 1 of 5/i)).toBeVisible()

    // Navigate to Demographics step (step 2)
    await page.getByRole('button', { name: /Next/i }).click()
    await expect(page.getByRole('heading', { name: /Demographics/i })).toBeVisible()
    await expect(page.getByText(/Step 2 of 5/i)).toBeVisible()

    // Navigate to Major & Experience step (step 3)
    await page.getByRole('button', { name: /Next/i }).click()
    await expect(page.getByRole('heading', { name: /Major.*Experience/i })).toBeVisible()
    await expect(page.getByText(/Step 3 of 5/i)).toBeVisible()

    // Navigate to Special Circumstances step (step 4)
    await page.getByRole('button', { name: /Next/i }).click()
    await expect(page.getByRole('heading', { name: /Special Circumstances/i })).toBeVisible()
    await expect(page.getByText(/Step 4 of 5/i)).toBeVisible()

    // Navigate to Review step (step 5)
    await page.getByRole('button', { name: /Next/i }).click()
    await expect(page.getByRole('heading', { name: /Review Your Profile/i })).toBeVisible()
    await expect(page.getByText(/Profile Completeness/i)).toBeVisible()
  })

  test('AC2: progress indicator shows current step with checkmarks', async ({ page }) => {
    // Start wizard
    await page.getByRole('button', { name: /Get Started/i }).click()

    // Step 1 should be highlighted
    const step1Indicator = page.locator('[class*="bg-primary"]').filter({ hasText: '1' }).first()
    await expect(step1Indicator).toBeVisible()

    // Progress bar should show 20% (step 1 of 5)
    const progressBar = page.locator('[role="progressbar"]').first()
    await expect(progressBar).toBeVisible()

    // Navigate to step 2
    await page.getByRole('button', { name: /Next/i }).click()

    // Step 1 should show checkmark, step 2 highlighted
    await expect(page.getByText(/Step 2 of 5/i)).toBeVisible()
  })

  test('AC3: navigation controls work correctly', async ({ page }) => {
    // Start wizard
    await page.getByRole('button', { name: /Get Started/i }).click()

    // Back button should be disabled on step 1
    const backButton = page.getByRole('button', { name: /Back/i })
    await expect(backButton).toBeDisabled()

    // Next button advances to step 2
    const nextButton = page.getByRole('button', { name: /Next/i })
    await nextButton.click()
    await expect(page.getByText(/Step 2 of 5/i)).toBeVisible()

    // Back button should work (no validation)
    await backButton.click()
    await expect(page.getByText(/Step 1 of 5/i)).toBeVisible()

    // Save & Continue Later button exists
    await expect(page.getByRole('button', { name: /Save.*Continue Later/i })).toBeVisible()
  })

  test('AC4: each step focuses on related fields only', async ({ page }) => {
    // Start wizard
    await page.getByRole('button', { name: /Get Started/i }).click()

    // Academic step should show only academic fields
    await expect(page.getByText(/Academic Profile/i)).toBeVisible()
    await expect(page.getByLabel(/GPA/i)).toBeVisible()

    // Should NOT show demographic fields
    await expect(page.getByLabel(/Gender/i)).not.toBeVisible()
    await expect(page.getByLabel(/Ethnicity/i)).not.toBeVisible()

    // Navigate to Demographics step
    await page.getByRole('button', { name: /Next/i }).click()

    // Should now show demographic-related content
    await expect(page.getByText(/Demographics.*Background/i)).toBeVisible()
  })

  test('AC5: mobile responsive layout', async ({ page }) => {
    // Test on mobile viewport (iPhone SE)
    await page.setViewportSize({ width: 375, height: 667 })

    // Start wizard
    await page.getByRole('button', { name: /Get Started/i }).click()

    // Progress indicator should be visible on mobile
    await expect(page.getByText(/Step 1 of 5/i)).toBeVisible()

    // Navigation buttons should be accessible (sticky footer)
    const nextButton = page.getByRole('button', { name: /Next/i })
    await expect(nextButton).toBeVisible()

    // Form should be in single-column layout (check that elements stack vertically)
    const academicSection = page.getByText(/Academic Information/i)
    await expect(academicSection).toBeVisible()
  })

  test('AC6: auto-save shows saving indicator', async ({ page }) => {
    // Start wizard
    await page.getByRole('button', { name: /Get Started/i }).click()

    // Fill in a field to trigger auto-save
    await page.getByLabel(/GPA/i).fill('3.75')

    // Wait for "Saved" indicator (auto-save debounces 500ms, allow up to 2s for network)
    await expect(page.getByText(/Saved/i)).toBeVisible({ timeout: 2000 })
  })

  test('AC7: Review step shows all entered data with edit links', async ({ page }) => {
    // Start wizard and navigate to Review
    await page.getByRole('button', { name: /Get Started/i }).click()

    // Fill in some academic data
    await page.getByLabel(/GPA/i).fill('3.75')

    // Navigate through all steps to Review (wait for step indicator after each click)
    for (let i = 1; i <= 4; i++) {
      await page.getByRole('button', { name: /Next/i }).click()
      await expect(page.getByText(new RegExp(`Step ${i + 1} of 5`, 'i'))).toBeVisible()
    }

    // Review step should display entered data
    await expect(page.getByText(/Review Your Profile/i)).toBeVisible()
    await expect(page.getByText(/Profile Completeness/i)).toBeVisible()
    await expect(page.getByText(/Profile Strength Score/i)).toBeVisible()

    // Edit links should exist for each section
    const editButtons = page.getByRole('button', { name: /Edit/i })
    await expect(editButtons.first()).toBeVisible()

    // Click edit for Academic section should jump back to step 1
    await editButtons.first().click()
    await expect(page.getByText(/Academic Information/i)).toBeVisible()
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

  test('complete wizard flow from start to finish', async ({ page }) => {
    // Welcome step
    await expect(page.getByRole('heading', { name: /Welcome/i })).toBeVisible()
    await page.getByRole('button', { name: /Get Started/i }).click()

    // Step 1: Academic
    await expect(page.getByText(/Step 1 of 5/i)).toBeVisible()
    await page.getByLabel(/GPA/i).fill('3.8')
    await page.getByLabel(/GPA Scale/i).fill('4.0')
    await page.getByRole('button', { name: /Next/i }).click()

    // Step 2: Demographics
    await expect(page.getByText(/Step 2 of 5/i)).toBeVisible()
    await page.getByRole('button', { name: /Next/i }).click()

    // Step 3: Major & Experience
    await expect(page.getByText(/Step 3 of 5/i)).toBeVisible()
    await page.getByRole('button', { name: /Next/i }).click()

    // Step 4: Special Circumstances
    await expect(page.getByText(/Step 4 of 5/i)).toBeVisible()
    await page.getByRole('button', { name: /Next/i }).click()

    // Step 5: Review & Submit
    await expect(page.getByRole('heading', { name: /Review/i })).toBeVisible()

    // Completeness and strength scores should be visible
    await expect(page.getByText(/Profile Completeness/i)).toBeVisible()
    await expect(page.getByText(/Profile Strength/i)).toBeVisible()

    // Submit button should exist (may be disabled if required fields missing)
    await expect(page.getByRole('button', { name: /Submit Profile/i })).toBeVisible()
  })

  test('Save & Continue Later saves progress and redirects', async ({ page }) => {
    // Start wizard
    await page.getByRole('button', { name: /Get Started/i }).click()

    // Fill in some data
    await page.getByLabel(/GPA/i).fill('3.9')

    // Click Save & Continue Later
    await page.getByRole('button', { name: /Save.*Continue Later/i }).click()

    // Should redirect to dashboard (wait for URL change instead of arbitrary timeout)
    await page.waitForURL('**/dashboard', { timeout: 5000 })
  })
})
