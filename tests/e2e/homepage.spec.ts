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
    await page.waitForSelector('input[name="identifier"]')
    await expect(page.locator('input[name="identifier"]')).toBeVisible()
  })

  test('should allow authenticated users to view homepage', async ({
    authenticatedPage,
  }) => {
    // ✅ Test authenticated user can access homepage
    // Note: Homepage is a public route, so authenticated users can still view it
    await authenticatedPage.goto('/')

    // Should successfully load homepage
    const url = authenticatedPage.url()
    expect(url).toContain('/')

    // Verify homepage content is visible
    await expect(authenticatedPage.locator('[data-testid="app-title"]')).toBeVisible()
    await expect(authenticatedPage.locator('[data-testid="app-tagline"]')).toBeVisible()
  })
})
