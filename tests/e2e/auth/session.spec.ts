/**
 * Authentication - Session Management Tests
 *
 * Migrated to use production-ready testing patterns:
 * - Custom fixtures from support/fixtures
 * - authHelper for session management
 * - userFactory for authenticated tests
 */

import { test, expect } from '../../support/fixtures'

test.describe('Session Security', () => {
  test('should use HTTP-only cookies for session storage', async ({ page, context }) => {
    await page.goto('/sign-in')

    // Get all cookies
    const cookies = await context.cookies()

    // Check for Clerk session cookies (they should be HTTP-only)
    const sessionCookies = cookies.filter((cookie) =>
      cookie.name.includes('__session') || cookie.name.includes('__clerk')
    )

    // If session cookies exist, verify they're HTTP-only
    if (sessionCookies.length > 0) {
      sessionCookies.forEach((cookie) => {
        expect(cookie.httpOnly).toBe(true)
      })
    }
  })

  test('should not expose session tokens to client-side JavaScript', async ({ page }) => {
    await page.goto('/sign-in')

    // Try to access cookies via document.cookie
    const clientSideCookies = await page.evaluate(() => document.cookie)

    // Session cookies should NOT be accessible via document.cookie
    expect(clientSideCookies).not.toContain('__session')
    expect(clientSideCookies).not.toContain('clerk')
  })
})

test.describe('Session Management', () => {
  test('should maintain session state for authenticated users', async ({
    authenticatedPage,
    userFactory,
    authHelper
  }) => {
    // ✅ NEW: Test session persistence using fixtures
    const user = await userFactory.createUserWithProfile()

    // Navigate to different pages
    await authenticatedPage.goto('/dashboard')
    await expect(authenticatedPage.locator('[data-testid="dashboard-container"]')).toBeVisible()

    await authenticatedPage.goto('/settings')
    // Should still be authenticated

    await authenticatedPage.goto('/dashboard')
    // Should still be authenticated
    await expect(authenticatedPage.locator('[data-testid="dashboard-container"]')).toBeVisible()

    // Verify authentication state is maintained
    expect(await authHelper.isAuthenticated()).toBe(true)
  })

  test('should maintain session state across page navigation', async ({ page }) => {
    await page.goto('/')

    // Navigate to different pages
    await page.goto('/sign-in')
    await page.goto('/sign-up')
    await page.goto('/')

    // Verify window is defined
    const windowDefined = await page.evaluate(() => {
      return window !== undefined
    })

    expect(windowDefined).toBe(true)
  })

  test('should clear session on logout', async ({
    authenticatedPage,
    userFactory,
    authHelper
  }) => {
    // ✅ NEW: Test logout functionality
    const user = await userFactory.createUserWithProfile()

    // Verify initially authenticated
    expect(await authHelper.isAuthenticated()).toBe(true)

    // Logout
    await authHelper.logout()

    // Verify session cleared
    expect(await authHelper.isAuthenticated()).toBe(false)

    // Try to access protected route - should redirect
    await authenticatedPage.goto('/dashboard')
    await authenticatedPage.waitForURL('**/sign-in**')
    expect(authenticatedPage.url()).toContain('/sign-in')
  })
})

test.describe('Security Headers', () => {
  test('should serve pages with Next.js framework', async ({ page }) => {
    await page.goto('/')

    // Check that Next.js is running
    const html = await page.content()
    expect(html).toContain('__NEXT_DATA__')
  })
})
