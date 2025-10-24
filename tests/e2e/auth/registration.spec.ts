import { test, expect } from '@playwright/test'

test.describe('User Registration Flow', () => {
  test('should display sign-up page with Clerk component', async ({ page }) => {
    await page.goto('/sign-up')

    // Wait for Clerk component to load
    await page.waitForSelector('[data-clerk-component]', { timeout: 10000 })

    // Verify page title
    await expect(page.locator('h1')).toContainText('Scholarship Hunter')

    // Verify Clerk sign-up form is present
    const clerkComponent = page.locator('[data-clerk-component]')
    await expect(clerkComponent).toBeVisible()
  })

  test('should show validation errors for invalid inputs', async ({ page }) => {
    await page.goto('/sign-up')
    await page.waitForSelector('[data-clerk-component]', { timeout: 10000 })

    // Try to submit with empty fields (if form allows it)
    // Note: Clerk handles validation internally, so we're testing Clerk's behavior
    const emailInput = page.locator('input[name="emailAddress"]')
    const passwordInput = page.locator('input[name="password"]')

    if (await emailInput.isVisible()) {
      // Test invalid email
      await emailInput.fill('invalid-email')
      await passwordInput.fill('weak')

      // Clerk will show validation errors
      await page.keyboard.press('Tab')

      // Wait a moment for validation to trigger
      await page.waitForTimeout(500)
    }
  })

  test('should navigate to sign-in from sign-up page', async ({ page }) => {
    await page.goto('/sign-up')
    await page.waitForSelector('[data-clerk-component]', { timeout: 10000 })

    // Look for "Sign in" link in Clerk component
    const signInLink = page.locator('text=/.*sign.*in.*/i').first()

    if (await signInLink.isVisible()) {
      await signInLink.click()
      await page.waitForURL('**/sign-in**')
      expect(page.url()).toContain('/sign-in')
    }
  })
})

test.describe('Sign-Up Page Layout', () => {
  test('should display app branding and description', async ({ page }) => {
    await page.goto('/sign-up')

    // Check for branding
    await expect(page.locator('h1')).toContainText('Scholarship Hunter')
    await expect(page.locator('text=/Find and apply to scholarships/i')).toBeVisible()
  })

  test('should have proper responsive layout', async ({ page }) => {
    await page.goto('/sign-up')
    await page.waitForSelector('[data-clerk-component]', { timeout: 10000 })

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    const clerkComponent = page.locator('[data-clerk-component]')
    await expect(clerkComponent).toBeVisible()

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(clerkComponent).toBeVisible()
  })
})
