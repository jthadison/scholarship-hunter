import { test, expect } from '../support/fixtures'

/**
 * Shelby Page Tests with Real Authentication
 *
 * Uses the authenticatedPage fixture for pre-authenticated access.
 */

test.describe('/shelby page with authentication', () => {
  test('should load and display Shelby dashboard content', async ({ authenticatedPage }) => {
    // Navigate to /shelby
    await authenticatedPage.goto('/shelby')

    // Verify page loaded
    await expect(authenticatedPage).toHaveURL(/\/shelby/)

    // Check for main content area
    await expect(authenticatedPage.locator('main')).toBeVisible()

    // Verify we're on the shelby page
    expect(authenticatedPage.url()).toContain('/shelby')
  })

  test('should display Shelby header and navigation', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/shelby')

    // Verify page loaded
    await expect(authenticatedPage).toHaveURL(/\/shelby/)

    // Check for header/navigation elements
    const hasHeader = await authenticatedPage.locator('header, [role="banner"]').count()
    const hasNav = await authenticatedPage.locator('nav, [role="navigation"]').count()

    // Should have navigation elements
    expect(hasHeader + hasNav).toBeGreaterThan(0)
  })

  test('should check for Shelby-specific content', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/shelby')

    // Verify page loaded
    await expect(authenticatedPage).toHaveURL(/\/shelby/)

    // Get all visible text
    const pageText = await authenticatedPage.locator('body').textContent()

    // Basic assertion - page should have content
    expect(pageText).toBeTruthy()
    expect(pageText!.length).toBeGreaterThan(50)
  })
})

test.describe('/shelby page without authentication (should redirect)', () => {
  test('should redirect to sign-in when not authenticated', async ({ page, context }) => {
    // Clear all cookies to ensure we're not authenticated
    await context.clearCookies()

    // Try to access /shelby
    await page.goto('/shelby')

    // Should be redirected to sign-in
    await page.waitForURL('**/sign-in**', { timeout: 10000 })
    expect(page.url()).toContain('/sign-in')

    // Should see Clerk sign-in component
    // Clerk renders the sign-in form even without data-clerk-component attribute
    // Check for sign-in heading instead
    const signInHeading = page.locator('text="Sign in to My Application"')
    await expect(signInHeading).toBeVisible()

    // Verify we see the email input
    const emailInput = page.locator('input[placeholder*="email" i]')
    await expect(emailInput).toBeVisible()
  })
})

/**
 * Setup Instructions:
 *
 * 1. Create a test user in Clerk Dashboard:
 *    - Go to your Clerk dashboard
 *    - Navigate to Users
 *    - Create a new test user with email and password
 *
 * 2. Set environment variables:
 *    - Create a .env.test file or set in your shell:
 *      TEST_USER_EMAIL=your-test-user@example.com
 *      TEST_USER_PASSWORD=YourTestPassword123!
 *
 * 3. Run the test:
 *    pnpm exec playwright test shelby-authenticated --project=chromium
 */
