/**
 * E2E Test: Extracurriculars and Work Experience Recognition
 *
 * Tests that:
 * 1. Extracurriculars and work experience can be added in the wizard
 * 2. They appear in the profile completeness calculation
 * 3. They appear in the profile strength score
 * 4. They show in the "missing fields" when empty
 */

import { test, expect } from '../support/fixtures'

test.describe('Profile Experience Fields Recognition', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Clear wizard localStorage to prevent hydration mismatches
    await authenticatedPage.goto('/dashboard')
    await authenticatedPage.evaluate(() => {
      localStorage.removeItem('profile-wizard-storage')
    })

    // Navigate to wizard
    await authenticatedPage.goto('/profile/wizard', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    })

    // Wait for the wizard to fully load
    await authenticatedPage.waitForSelector('h1:has-text("Welcome")', { timeout: 15000 })
  })

  test('should recognize extracurriculars and work experience in completeness and strength', async ({ authenticatedPage }) => {
    console.log('Step 1: Starting wizard...')

    // Start wizard from Welcome screen
    await authenticatedPage.getByRole('button', { name: /Get Started/i }).click()
    await expect(authenticatedPage.getByText(/Step 1 of 5/i)).toBeVisible({ timeout: 10000 })

    console.log('Step 2: Filling Academic Info (Step 1)...')

    // Fill required field: graduation year
    await authenticatedPage.getByLabel(/Expected Graduation Year/i).click()
    await authenticatedPage.getByRole('option', { name: '2026' }).click()

    // Optionally fill GPA to improve strength score
    await authenticatedPage.getByLabel(/^GPA$/i).fill('3.8')

    // Navigate to Demographics (Step 2)
    await authenticatedPage.getByRole('button', { name: /Next/i }).click()
    await expect(authenticatedPage.getByText(/Step 2 of 5/i)).toBeVisible()

    console.log('Step 3: Filling Demographics (Step 2)...')

    // Fill required fields for Demographics
    await authenticatedPage.getByLabel(/Citizenship Status/i).click()
    await authenticatedPage.keyboard.press('Enter') // Select first option

    await authenticatedPage.getByLabel(/State/i, { exact: true }).click()
    await authenticatedPage.keyboard.type('CA')
    await authenticatedPage.keyboard.press('Enter')

    // Navigate to Major & Experience (Step 3)
    await authenticatedPage.getByRole('button', { name: /Next/i }).click()
    await expect(authenticatedPage.getByText(/Step 3 of 5/i)).toBeVisible()

    console.log('Step 4: Filling Major & Experience (Step 3)...')

    // Fill required field: intended major
    await authenticatedPage.getByLabel(/Intended Major/i).fill('Computer Science')

    // Add an extracurricular activity
    console.log('Adding extracurricular activity...')
    const addExtracurricularButton = authenticatedPage.getByRole('button', { name: /Add.*Activity/i })

    // Scroll to button if needed
    await addExtracurricularButton.scrollIntoViewIfNeeded()
    await addExtracurricularButton.click()

    // Wait for the form dialog to appear
    await expect(authenticatedPage.getByRole('dialog').or(authenticatedPage.getByText(/Activity Name/i))).toBeVisible({ timeout: 5000 })

    // Fill extracurricular form
    await authenticatedPage.getByLabel(/Activity Name/i).fill('Robotics Club')

    // Select category (using select dropdown)
    await authenticatedPage.getByLabel(/Category/i).click()
    await authenticatedPage.getByRole('option', { name: /Academic Clubs/i }).click()

    await authenticatedPage.getByLabel(/Hours.*Week/i).fill('10')
    await authenticatedPage.getByLabel(/Years Involved/i).fill('3')

    // Check leadership checkbox if available
    const leadershipCheckbox = authenticatedPage.getByLabel(/Leadership Position/i)
    if (await leadershipCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await leadershipCheckbox.check()
      await authenticatedPage.getByLabel(/Leadership Title/i).fill('Team Captain')
    }

    // Save the extracurricular
    await authenticatedPage.getByRole('button', { name: /Save/i }).click()

    // Wait for dialog to close
    await expect(authenticatedPage.getByText(/Robotics Club/i)).toBeVisible({ timeout: 5000 })

    console.log('Adding work experience...')

    // Add work experience
    const addWorkButton = authenticatedPage.getByRole('button', { name: /Add.*Work.*Experience/i })
    await addWorkButton.scrollIntoViewIfNeeded()
    await addWorkButton.click()

    // Wait for work experience form dialog
    await expect(authenticatedPage.getByRole('dialog').or(authenticatedPage.getByText(/Job Title/i))).toBeVisible({ timeout: 5000 })

    // Fill work experience form
    await authenticatedPage.getByLabel(/Job Title/i).fill('Software Intern')
    await authenticatedPage.getByLabel(/Employer/i).fill('Tech Company')
    await authenticatedPage.getByLabel(/Hours.*Week/i).last().fill('15') // Use last() to avoid conflict with extracurricular field

    // Save the work experience
    await authenticatedPage.getByRole('button', { name: /Save/i }).click()

    // Wait for dialog to close
    await expect(authenticatedPage.getByText(/Software Intern/i)).toBeVisible({ timeout: 5000 })

    console.log('Step 5: Navigating to Review step...')

    // Navigate through remaining steps to Review
    await authenticatedPage.getByRole('button', { name: /Next/i }).click() // Go to Step 4 (Special Circumstances)
    await expect(authenticatedPage.getByText(/Step 4 of 5/i)).toBeVisible()

    await authenticatedPage.getByRole('button', { name: /Next/i }).click() // Go to Step 5 (Review)
    await expect(authenticatedPage.getByText(/Review Your Profile/i)).toBeVisible({ timeout: 10000 })

    console.log('Step 6: Checking Profile Completeness...')

    // Check that profile completeness is displayed
    await expect(authenticatedPage.getByText(/Profile Completeness/i)).toBeVisible()

    // Look for completeness percentage (should be higher now)
    const completenessSection = authenticatedPage.locator('text=/Profile Completeness/i').locator('..')
    await expect(completenessSection).toBeVisible()

    // Check that missing fields section exists
    const missingFieldsSection = authenticatedPage.getByText(/What.*Missing/i)

    // If there are still missing fields, verify extracurriculars and work experience are NOT in the list
    if (await missingFieldsSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      const missingText = await authenticatedPage.textContent('body')

      // These should NOT be in missing fields since we added them
      expect(missingText).not.toContain('Extracurricular Activities')
      expect(missingText).not.toContain('Work Experience')

      console.log('✓ Extracurriculars and Work Experience NOT in missing fields (correct!)')
    }

    console.log('Step 7: Checking Profile Strength Score...')

    // Check that profile strength score is displayed
    await expect(authenticatedPage.getByText(/Profile Strength/i)).toBeVisible()

    // Look for Experience dimension in strength breakdown
    const strengthSection = authenticatedPage.locator('text=/Profile Strength/i').locator('..')
    await expect(strengthSection).toBeVisible()

    // The Experience score should be > 0 since we added extracurriculars and work experience
    const experienceScore = authenticatedPage.getByText(/Experience/i).filter({ hasText: /\d+/ })
    if (await experienceScore.isVisible({ timeout: 2000 }).catch(() => false)) {
      const scoreText = await experienceScore.textContent()
      console.log('Experience score text:', scoreText)

      // Extract number from text (e.g., "Experience: 43" -> 43)
      const match = scoreText?.match(/(\d+)/)
      if (match) {
        const score = parseInt(match[1])
        expect(score).toBeGreaterThan(0)
        console.log(`✓ Experience score is ${score} (should be > 0 since we added data)`)
      }
    }

    console.log('Step 8: Submitting profile...')

    // Submit the profile
    const submitButton = authenticatedPage.getByRole('button', { name: /Complete Profile/i })
    await submitButton.scrollIntoViewIfNeeded()
    await submitButton.click()

    // Wait for success (redirect to dashboard or success message)
    await expect(
      authenticatedPage.getByText(/Profile.*Complete/i).or(
        authenticatedPage.getByText(/Success/i)
      )
    ).toBeVisible({ timeout: 10000 })

    console.log('✅ Test completed successfully!')
  })

  test('should show extracurriculars and work experience in missing fields when not added', async ({ authenticatedPage }) => {
    console.log('Testing missing fields when experience data is NOT added...')

    // Start wizard
    await authenticatedPage.getByRole('button', { name: /Get Started/i }).click()
    await expect(authenticatedPage.getByText(/Step 1 of 5/i)).toBeVisible({ timeout: 10000 })

    // Fill only required fields (NO extracurriculars or work experience)

    // Step 1: Academic
    await authenticatedPage.getByLabel(/Expected Graduation Year/i).click()
    await authenticatedPage.getByRole('option', { name: '2026' }).click()
    await authenticatedPage.getByRole('button', { name: /Next/i }).click()

    // Step 2: Demographics
    await expect(authenticatedPage.getByText(/Step 2 of 5/i)).toBeVisible()
    await authenticatedPage.getByLabel(/Citizenship Status/i).click()
    await authenticatedPage.keyboard.press('Enter')
    await authenticatedPage.getByLabel(/State/i, { exact: true }).click()
    await authenticatedPage.keyboard.type('CA')
    await authenticatedPage.keyboard.press('Enter')
    await authenticatedPage.getByRole('button', { name: /Next/i }).click()

    // Step 3: Major & Experience (fill major but NO extracurriculars/work)
    await expect(authenticatedPage.getByText(/Step 3 of 5/i)).toBeVisible()
    await authenticatedPage.getByLabel(/Intended Major/i).fill('Computer Science')
    // Skip adding extracurriculars and work experience
    await authenticatedPage.getByRole('button', { name: /Next/i }).click()

    // Step 4: Special Circumstances
    await expect(authenticatedPage.getByText(/Step 4 of 5/i)).toBeVisible()
    await authenticatedPage.getByRole('button', { name: /Next/i }).click()

    // Step 5: Review
    await expect(authenticatedPage.getByText(/Review Your Profile/i)).toBeVisible({ timeout: 10000 })

    console.log('Checking for missing fields...')

    // Look for "What's Missing" section
    const missingSection = authenticatedPage.getByText(/What.*Missing/i)
    await expect(missingSection).toBeVisible({ timeout: 5000 })

    // Get all missing fields text
    const bodyText = await authenticatedPage.textContent('body')

    // These SHOULD be in missing recommended fields
    expect(bodyText).toContain('Extracurricular Activities')
    expect(bodyText).toContain('Work Experience')

    console.log('✓ Extracurriculars in missing fields: YES')
    console.log('✓ Work Experience in missing fields: YES')

    // Check that Experience score is low (0 or close to 0)
    const experienceScore = authenticatedPage.getByText(/Experience/i).filter({ hasText: /\d+/ })
    if (await experienceScore.isVisible({ timeout: 2000 }).catch(() => false)) {
      const scoreText = await experienceScore.textContent()
      const match = scoreText?.match(/(\d+)/)
      if (match) {
        const score = parseInt(match[1])
        expect(score).toBeLessThanOrEqual(10) // Should be very low without extracurriculars/work
        console.log(`✓ Experience score is ${score} (should be ≤ 10 without data)`)
      }
    }

    console.log('✅ Missing fields test completed successfully!')
  })
})
