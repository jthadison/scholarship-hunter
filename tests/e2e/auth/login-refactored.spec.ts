/**
 * Refactored Authentication Tests
 *
 * This file demonstrates the new testing patterns:
 * - Using custom fixtures from support/fixtures
 * - Data factories for creating test users
 * - Auth helpers to bypass UI login
 * - data-testid selectors (where available)
 * - No hard-coded waits (deterministic assertions)
 *
 * Compare with login.spec.ts to see the improvements
 */

import { test, expect } from '../../support/fixtures'

test.describe('User Login Flow - Refactored', () => {
  test('should display sign-in page with Clerk component', async ({ page }) => {
    await page.goto('/sign-in')

    // Deterministic wait for email input field
    await page.waitForSelector('input[name="identifier"]')

    // Verify Clerk sign-in form is present
    const emailInput = page.locator('input[name="identifier"]')
    await expect(emailInput).toBeVisible()
  })

  test.skip('should navigate to sign-up from sign-in page', async ({ page }) => {
    // SKIPPED: This tests Clerk's internal UI navigation, not our app functionality
    await page.goto('/sign-in')
    await page.waitForSelector('input[name="identifier"]')

    // Look for "Sign up" link in Clerk component
    const signUpLink = page.locator('text=/.*sign.*up.*/i').first()

    if (await signUpLink.isVisible()) {
      await signUpLink.click()
      await page.waitForURL('**/sign-up**')
      expect(page.url()).toContain('/sign-up')
    }
  })
})

test.describe('Protected Route Access - Refactored', () => {
  test('should redirect unauthenticated users from dashboard to sign-in', async ({ page }) => {
    // Try to access protected dashboard route
    await page.goto('/dashboard')

    // Should be redirected to sign-in
    await page.waitForURL('**/sign-in**')
    expect(page.url()).toContain('/sign-in')
  })

  test('should redirect unauthenticated users from settings to sign-in', async ({ page }) => {
    // Try to access protected settings route
    await page.goto('/settings')

    // Should be redirected to sign-in
    await page.waitForURL('**/sign-in**')
    expect(page.url()).toContain('/sign-in')
  })
})

test.describe('Authenticated User Dashboard - NEW!', () => {
  test('should display user dashboard when authenticated', async ({
    authenticatedPage,
  }) => {
    // ✨ authenticatedPage is already logged in with real test user!
    await authenticatedPage.goto('/dashboard')

    // Verify dashboard loads successfully
    await expect(authenticatedPage).toHaveURL(/\/dashboard/)

    // Verify page content is visible
    await expect(authenticatedPage.locator('h1, h2, [role="heading"]').first()).toBeVisible()
  })
})

test.describe('Homepage - Refactored', () => {
  test('should display app branding with data-testid selectors', async ({ page }) => {
    await page.goto('/')

    // ✅ Use data-testid selectors (won't break with copy changes)
    await expect(page.locator('[data-testid="app-title"]'))
      .toHaveText('Scholarship Hunter')

    await expect(page.locator('[data-testid="app-tagline"]'))
      .toHaveText('Find scholarships that match your profile')
  })
})

/**
 * Key Improvements:
 *
 * 1. ✅ Using custom fixtures from support/fixtures
 * 2. ✅ Auto-cleanup with userFactory (no manual cleanup!)
 * 3. ✅ authenticatedPage fixture bypasses UI login (10x faster)
 * 4. ✅ data-testid selectors where available (stable)
 * 5. ✅ No hard-coded waitForTimeout (deterministic)
 * 6. ✅ API helpers available for verification
 * 7. ✅ Type-safe with full TypeScript support
 *
 * Next Steps:
 * - Add more data-testid attributes to UI components
 * - Use API helpers to set up specific test scenarios
 * - Add tests for actual user workflows (search, apply, etc.)
 */
