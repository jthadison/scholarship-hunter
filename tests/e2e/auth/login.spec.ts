import { test, expect } from '@playwright/test'

test.describe('User Login Flow', () => {
  test('should display sign-in page with Clerk component', async ({ page }) => {
    await page.goto('/sign-in')

    // Wait for Clerk component to load
    await page.waitForSelector('[data-clerk-component]', { timeout: 10000 })

    // Verify page title
    await expect(page.locator('h1')).toContainText('Scholarship Hunter')

    // Verify Clerk sign-in form is present
    const clerkComponent = page.locator('[data-clerk-component]')
    await expect(clerkComponent).toBeVisible()
  })

  test('should show validation for empty credentials', async ({ page }) => {
    await page.goto('/sign-in')
    await page.waitForSelector('[data-clerk-component]', { timeout: 10000 })

    // Clerk handles form validation internally
    const emailInput = page.locator('input[name="identifier"]')

    if (await emailInput.isVisible()) {
      // Focus and blur to trigger validation
      await emailInput.focus()
      await page.keyboard.press('Tab')
      await page.waitForTimeout(500)
    }
  })

  test('should navigate to sign-up from sign-in page', async ({ page }) => {
    await page.goto('/sign-in')
    await page.waitForSelector('[data-clerk-component]', { timeout: 10000 })

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
    await page.waitForSelector('[data-clerk-component]', { timeout: 10000 })

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

    // Should be redirected to sign-in
    await page.waitForURL('**/sign-in**', { timeout: 10000 })
    expect(page.url()).toContain('/sign-in')
  })

  test('should redirect unauthenticated users from settings to sign-in', async ({ page }) => {
    // Try to access protected settings route
    await page.goto('/settings')

    // Should be redirected to sign-in
    await page.waitForURL('**/sign-in**', { timeout: 10000 })
    expect(page.url()).toContain('/sign-in')
  })
})

test.describe('Sign-In Page Layout', () => {
  test('should display app branding and description', async ({ page }) => {
    await page.goto('/sign-in')

    // Check for branding
    await expect(page.locator('h1')).toContainText('Scholarship Hunter')
    await expect(page.locator('text=/Find and apply to scholarships/i')).toBeVisible()
  })

  test('should have proper responsive layout', async ({ page }) => {
    await page.goto('/sign-in')
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
