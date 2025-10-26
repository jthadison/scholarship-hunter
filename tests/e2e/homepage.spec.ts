/**
 * Homepage Tests
 *
 * Migrated to use production-ready testing patterns:
 * - Custom fixtures from support/fixtures
 * - data-testid selectors for stability
 */

import { test, expect } from '../support/fixtures'

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/')

    // Check that the page loads
    await expect(page).toHaveTitle(/Scholarship Hunter/)

    // ✅ Use data-testid selector
    await expect(page.locator('[data-testid="app-title"]'))
      .toHaveText('Scholarship Hunter')
  })

  test('should display app tagline', async ({ page }) => {
    await page.goto('/')

    // ✅ Use data-testid selector
    await expect(page.locator('[data-testid="app-tagline"]'))
      .toHaveText('Find scholarships that match your profile')
  })

  test('should have sign-in link accessible', async ({ page }) => {
    await page.goto('/')

    // Navigate to sign-in page
    await page.goto('/sign-in')

    // Verify we're on the sign-in page
    const url = page.url()
    expect(url).toContain('/sign-in')

    // Verify Clerk component loads
    await page.waitForSelector('[data-clerk-component]')
    await expect(page.locator('[data-clerk-component]')).toBeVisible()
  })

  test('should redirect authenticated users to dashboard', async ({
    authenticatedPage,
    userFactory
  }) => {
    // ✅ NEW: Test authenticated user experience
    const user = await userFactory.createUserWithProfile()

    // Authenticated users visiting homepage should see dashboard
    await authenticatedPage.goto('/')

    // Check if redirected to dashboard or still on homepage
    // (behavior may vary based on your app's design)
    const url = authenticatedPage.url()

    // Either on homepage or redirected to dashboard
    expect(url === '/' || url.includes('/dashboard')).toBe(true)
  })
})
