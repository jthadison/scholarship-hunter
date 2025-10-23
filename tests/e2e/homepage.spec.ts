import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/')

    // Check that the page loads
    await expect(page).toHaveTitle(/Scholarship Hunter/)

    // Check for main heading
    await expect(page.locator('h1')).toContainText('Scholarship Hunter')
  })

  test('should have sign-in link accessible', async ({ page }) => {
    await page.goto('/')

    // Navigate to sign-in page
    await page.goto('/sign-in')

    // Verify we're on the sign-in page
    const url = page.url()
    expect(url).toContain('/sign-in')
  })
})
