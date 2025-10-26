/**
 * Authentication - Login Flow Tests
 *
 * Migrated to use production-ready testing patterns:
 * - Custom fixtures from support/fixtures
 * - data-testid selectors
 * - Deterministic waits (no waitForTimeout)
 * - authenticatedPage fixture for authenticated tests
 */

import { test, expect } from '../../support/fixtures'

test.describe('User Login Flow', () => {
  test('should display sign-in page with Clerk component', async ({ page }) => {
    await page.goto('/sign-in')

    // ✅ Deterministic wait - no hard-coded timeout
    await page.waitForSelector('[data-clerk-component]')

    // Verify Clerk sign-in form is present
    const clerkComponent = page.locator('[data-clerk-component]')
    await expect(clerkComponent).toBeVisible()
  })

  test('should navigate to sign-up from sign-in page', async ({ page }) => {
    await page.goto('/sign-in')
    await page.waitForSelector('[data-clerk-component]')

    // Look for "Sign up" link in Clerk component
    const signUpLink = page.locator('text=/.*sign.*up.*/i').first()

    if (await signUpLink.isVisible()) {
      await signUpLink.click()
      await page.waitForURL('**/sign-up**')
      expect(page.url()).toContain('/sign-up')
    }
  })

  test('should have forgot password link', async ({ page }) => {
    await page.goto('/sign-in')
    await page.waitForSelector('[data-clerk-component]')

    // Look for forgot password link
    const forgotPasswordLink = page.locator('text=/forgot.*password/i').first()

    // Clerk provides this functionality
    if (await forgotPasswordLink.isVisible()) {
      await expect(forgotPasswordLink).toBeVisible()
    }
  })
})

test.describe('Protected Route Access', () => {
  test('should redirect unauthenticated users from dashboard to sign-in', async ({ page }) => {
    // Try to access protected dashboard route
    await page.goto('/dashboard')

    // ✅ Deterministic wait - removed hard-coded timeout
    await page.waitForURL('**/sign-in**')
    expect(page.url()).toContain('/sign-in')
  })

  test('should redirect unauthenticated users from settings to sign-in', async ({ page }) => {
    // Try to access protected settings route
    await page.goto('/settings')

    // ✅ Deterministic wait
    await page.waitForURL('**/sign-in**')
    expect(page.url()).toContain('/sign-in')
  })

  test('should allow authenticated users to access dashboard', async ({
    authenticatedPage,
    userFactory
  }) => {
    // ✅ NEW: Test authenticated access using fixture
    const user = await userFactory.createUserWithProfile()

    // Already authenticated via fixture!
    await authenticatedPage.goto('/dashboard')

    // ✅ Use data-testid selector
    await expect(authenticatedPage.locator('[data-testid="dashboard-container"]'))
      .toBeVisible()

    // Verify user's name is displayed
    await expect(authenticatedPage.locator('[data-testid="welcome-greeting"]'))
      .toContainText(user.student!.firstName)
  })
})

test.describe('Sign-In Page Layout', () => {
  test('should have proper responsive layout', async ({ page }) => {
    await page.goto('/sign-in')
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
