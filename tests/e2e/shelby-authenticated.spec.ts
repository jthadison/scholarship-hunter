import { test, expect } from '@playwright/test'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') })

/**
 * Shelby Page Tests with Real Authentication
 *
 * This test uses Clerk's UI login flow to authenticate a real test user.
 * Credentials are loaded from .env.test file.
 */

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com'
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!'

console.log('Using test user:', TEST_USER_EMAIL)

test.describe('/shelby page with authentication', () => {
  test.beforeEach(async ({ page }) => {
    console.log('Logging in with email:', TEST_USER_EMAIL)

    // Navigate to sign-in page
    await page.goto('/sign-in')

    // Wait for Clerk sign-in form to load (either by data attribute or email input)
    try {
      await page.waitForSelector('[data-clerk-component]', { timeout: 5000 })
    } catch {
      // If data-clerk-component doesn't exist, wait for email input instead
      await page.waitForSelector('input[name="identifier"]', { timeout: 10000 })
    }

    // Fill in email
    const emailInput = page.locator('input[name="identifier"]').first()
    await emailInput.waitFor({ state: 'visible', timeout: 5000 })
    await emailInput.fill(TEST_USER_EMAIL)
    console.log('Filled email input')

    // Click Continue button
    const continueButton = page.locator('button:has-text("Continue")').first()
    await continueButton.click()
    console.log('Clicked Continue button')

    // Wait for password field to appear
    const passwordInput = page.locator('input[name="password"]').first()
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 })
    await passwordInput.fill(TEST_USER_PASSWORD)
    console.log('Filled password input')

    // Click submit
    const submitButton = page.locator('button[type="submit"]').first()
    await submitButton.click()
    console.log('Clicked submit button')

    // Wait for redirect (to dashboard or other authenticated page)
    await page.waitForURL(/\/(dashboard|profile|shelby)/, { timeout: 15000 })
    console.log('Successfully logged in, redirected to:', page.url())
  })

  test('should load and display Shelby dashboard content', async ({ page }) => {
    // Navigate to /shelby
    await page.goto('/shelby')

    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 15000 })

    // Take screenshot for debugging
    await page.screenshot({ path: 'tests/screenshots/shelby-authenticated.png', fullPage: true })

    // Check page title
    const title = await page.title()
    console.log('Page title:', title)
    expect(title).toBeTruthy()

    // Check for main content area
    const mainElement = page.locator('main')
    await expect(mainElement).toBeVisible()

    // Check for some expected content (adjust based on actual Shelby page structure)
    // You may need to update these selectors based on the actual page content
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).toBeTruthy()
    expect(bodyText!.length).toBeGreaterThan(0)

    // Log what's visible
    console.log('Body content preview:', bodyText?.substring(0, 300))

    // Check if we're actually on the shelby page (not redirected elsewhere)
    expect(page.url()).toContain('/shelby')
  })

  test('should display Shelby header and navigation', async ({ page }) => {
    await page.goto('/shelby')
    await page.waitForLoadState('networkidle', { timeout: 15000 })

    // Check for header/navigation elements
    const hasHeader = await page.locator('header, [role="banner"]').count()
    const hasNav = await page.locator('nav, [role="navigation"]').count()

    console.log('Has header:', hasHeader > 0)
    console.log('Has navigation:', hasNav > 0)

    // Should have navigation elements
    expect(hasHeader + hasNav).toBeGreaterThan(0)
  })

  test('should check for Shelby-specific content', async ({ page }) => {
    await page.goto('/shelby')
    await page.waitForLoadState('networkidle', { timeout: 15000 })

    // Get all visible text
    const pageText = await page.locator('body').textContent()

    // Log what we find
    console.log('Page contains "Shelby":', pageText?.includes('Shelby') || pageText?.includes('shelby'))
    console.log('Page contains "scholarship":', pageText?.toLowerCase().includes('scholarship'))

    // Take screenshot for manual verification
    await page.screenshot({ path: 'tests/screenshots/shelby-content.png', fullPage: true })

    // Check URL to ensure we're on the right page
    expect(page.url()).toContain('/shelby')
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
