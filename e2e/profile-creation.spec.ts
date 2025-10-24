import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Profile Creation Flow
 * Tests the complete user journey of creating and updating a student profile
 */

test.describe('Profile Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to profile creation page (adjust URL as needed)
    await page.goto('/profile/create')
  })

  test('should complete full profile creation wizard', async ({ page }) => {
    // Academic Information
    await page.fill('input[name="gpa"]', '3.8')
    await page.selectOption('select[name="gpaScale"]', '4.0')
    await page.fill('input[name="satScore"]', '1450')
    await page.selectOption('select[name="graduationYear"]', '2025')
    await page.selectOption('select[name="currentGrade"]', '12th Grade')

    // Demographic Information
    await page.selectOption('select[name="state"]', 'CA')
    await page.fill('input[name="city"]', 'Los Angeles')
    await page.fill('input[name="zipCode"]', '90210')
    await page.selectOption('select[name="citizenship"]', 'US Citizen')

    // Financial Need
    await page.selectOption('select[name="financialNeed"]', 'MODERATE')

    // Submit form
    await page.click('button[type="submit"]')

    // Verify success (adjust based on actual success indicators)
    await expect(page.locator('text=Profile Created')).toBeVisible()
  })

  test('should show validation errors for invalid GPA', async ({ page }) => {
    // Enter invalid GPA
    await page.fill('input[name="gpa"]', '5.0')
    await page.blur('input[name="gpa"]')

    // Check for validation error
    await expect(
      page.locator('text=/GPA cannot exceed 4.0/i')
    ).toBeVisible()
  })

  test('should show validation error for invalid ZIP code', async ({ page }) => {
    // Enter invalid ZIP code
    await page.fill('input[name="zipCode"]', '123')
    await page.blur('input[name="zipCode"]')

    // Check for validation error
    await expect(
      page.locator('text=/ZIP code must be in format/i')
    ).toBeVisible()
  })

  test('should update progress indicator as fields are filled', async ({
    page,
  }) => {
    // Check initial progress (should be low)
    const initialProgress = await page.textContent('[data-testid="progress-percentage"]')

    // Fill required fields
    await page.selectOption('select[name="graduationYear"]', '2025')
    await page.selectOption('select[name="citizenship"]', 'US Citizen')
    await page.selectOption('select[name="state"]', 'CA')
    await page.selectOption('select[name="financialNeed"]', 'MODERATE')

    // Check updated progress (should be higher)
    const updatedProgress = await page.textContent('[data-testid="progress-percentage"]')

    expect(parseInt(updatedProgress || '0')).toBeGreaterThan(
      parseInt(initialProgress || '0')
    )
  })

  test('should allow multi-select for ethnicity', async ({ page }) => {
    // Select multiple ethnicity options
    await page.check('input[value="Asian"]')
    await page.check('input[value="White/Caucasian"]')

    // Verify both are checked
    await expect(page.locator('input[value="Asian"]')).toBeChecked()
    await expect(page.locator('input[value="White/Caucasian"]')).toBeChecked()
  })

  test('should persist data on page reload', async ({ page }) => {
    // Fill some fields
    await page.fill('input[name="gpa"]', '3.8')
    await page.selectOption('select[name="state"]', 'CA')

    // Reload page
    await page.reload()

    // Verify data persists (adjust based on actual persistence mechanism)
    await expect(page.locator('input[name="gpa"]')).toHaveValue('3.8')
    await expect(page.locator('select[name="state"]')).toHaveValue('CA')
  })
})

test.describe('Profile Update Flow', () => {
  test('should update existing profile', async ({ page }) => {
    // Navigate to profile edit page (adjust URL as needed)
    await page.goto('/profile/edit')

    // Update GPA
    await page.fill('input[name="gpa"]', '3.9')

    // Save changes
    await page.click('button[type="submit"]')

    // Verify update success
    await expect(page.locator('text=Profile Updated')).toBeVisible()
  })
})
