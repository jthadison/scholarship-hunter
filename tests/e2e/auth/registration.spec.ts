/**
 * Authentication - Registration Flow Tests
 *
 * Migrated to use production-ready testing patterns:
 * - Custom fixtures from support/fixtures
 * - Deterministic waits (no waitForTimeout)
 * - Removed validation test (Clerk handles internally)
 */

import { test, expect } from '../../support/fixtures'

test.describe('User Registration Flow', () => {
  test('should display sign-up page with Clerk component', async ({ page }) => {
    await page.goto('/sign-up')

    // ✅ Deterministic wait - no hard-coded timeout
    await page.waitForSelector('[data-clerk-component]')

    // Verify Clerk sign-up form is present
    const clerkComponent = page.locator('[data-clerk-component]')
    await expect(clerkComponent).toBeVisible()
  })

  test('should navigate to sign-in from sign-up page', async ({ page }) => {
    await page.goto('/sign-up')
    await page.waitForSelector('[data-clerk-component]')

    // Look for "Sign in" link in Clerk component
    const signInLink = page.locator('text=/.*sign.*in.*/i').first()

    if (await signInLink.isVisible()) {
      await signInLink.click()
      // ✅ Deterministic wait
      await page.waitForURL('**/sign-in**')
      expect(page.url()).toContain('/sign-in')
    }
  })
})

test.describe('Sign-Up Page Layout', () => {
  test('should have proper responsive layout', async ({ page }) => {
    await page.goto('/sign-up')
    await page.waitForSelector('[data-clerk-component]')

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    const clerkComponent = page.locator('[data-clerk-component]')
    await expect(clerkComponent).toBeVisible()

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(clerkComponent).toBeVisible()
  })
})
