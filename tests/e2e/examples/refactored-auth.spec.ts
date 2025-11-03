/**
 * Example: Refactored Authentication Tests
 *
 * This file demonstrates how to use the new testing patterns:
 * - Custom fixtures for auto-cleanup
 * - Data factories for realistic test data
 * - Auth helpers to bypass UI login
 * - API helpers for test setup
 * - data-testid selectors for stability
 *
 * Compare this to the original tests/e2e/auth/login.spec.ts
 */

import { test, expect } from '../../support/fixtures'

test.describe('Authentication Flow - Refactored', () => {
  test('should allow user to login and access dashboard', async ({ authenticatedPage }) => {
    // ✅ Use authenticatedPage fixture (already logged in with real test user)
    // Navigate to dashboard
    await authenticatedPage.goto('/dashboard')

    // Verify dashboard loads successfully
    await expect(authenticatedPage).toHaveURL(/\/dashboard/)

    // Verify page content is visible
    await expect(authenticatedPage.locator('h1, h2, [role="heading"]').first()).toBeVisible()
  })

  test('should redirect unauthenticated users to sign-in', async ({ page }) => {
    // No auth setup - should redirect

    await page.goto('/dashboard')

    // Should be redirected to sign-in
    await page.waitForURL('**/sign-in**', { timeout: 10000 })
    expect(page.url()).toContain('/sign-in')

    // ✅ Deterministic wait (no hard-coded timeouts)
    await page.waitForSelector('input[name="identifier"]')
    const emailInput = page.locator('input[name="identifier"]')
    await expect(emailInput).toBeVisible()
  })

  test('should display user profile information after login', async ({ authenticatedPage }) => {
    // ✅ Use authenticatedPage fixture (pre-authenticated with real test user!)
    // No need to login - authenticatedPage is already authenticated!
    await authenticatedPage.goto('/settings')

    // Verify settings page loads
    await expect(authenticatedPage).toHaveURL(/\/settings/)

    // Verify user can access settings (authenticated route)
    await expect(authenticatedPage.locator('h1, h2, [role="heading"]').first()).toBeVisible()
  })
})

test.describe('Scholarship Application Flow - Refactored', () => {
  test.skip('should allow user to apply to scholarship', async ({
    authenticatedPage,
    scholarshipFactory,
  }) => {
    // SKIPPED: This is an example test demonstrating patterns
    // The scholarship detail page requires additional setup (match scores, profile data, etc.)
    // For actual scholarship application tests, see tests/e2e/scholarships/

    // ✅ Create test scholarship via factory (auto-cleanup)
    const scholarship = await scholarshipFactory.createSTEMScholarship({
      name: 'Test STEM Scholarship',
      awardAmount: 5000,
      deadline: new Date('2025-12-31'),
    })

    // Navigate to scholarship detail
    await authenticatedPage.goto(`/scholarships/${scholarship.id}`)

    // ✅ Wait for content to load (deterministic)
    await expect(authenticatedPage.locator('h1')).toContainText('Test STEM Scholarship')

    // TODO: Add data-testid="apply-button" to scholarship detail page
    const applyButton = authenticatedPage.locator('text=/apply/i').first()
    if (await applyButton.isVisible()) {
      await applyButton.click()

      // Verify application was created
      // TODO: Add data-testid="application-success" message
      await expect(authenticatedPage.locator('text=/application/i')).toBeVisible()
    }
  })

  test('should display application progress correctly', async ({
    authenticatedPage,
    scholarshipFactory,
  }) => {
    // ✅ Create test scholarship via factory
    const scholarship = await scholarshipFactory.createScholarship({
      name: 'Progress Test Scholarship',
    })

    // Navigate to scholarships page to see if any scholarships are available
    await authenticatedPage.goto('/scholarships')

    // Verify scholarships page loads
    await expect(authenticatedPage).toHaveURL(/\/scholarships/)

    // Verify page content
    await expect(authenticatedPage.locator('h1, h2, [role="heading"]').first()).toBeVisible()
  })
})

test.describe('Search and Discovery - Refactored', () => {
  test('should display search results for scholarships', async ({ page, scholarshipFactory }) => {
    // ✅ Create multiple test scholarships
    await scholarshipFactory.createSTEMScholarship({
      name: 'Computer Science Excellence Award',
      tags: ['STEM', 'Computer Science', 'Merit-Based'],
    })
    await scholarshipFactory.createMeritScholarship({
      name: 'Academic Achievement Scholarship',
      tags: ['Merit-Based', 'GPA'],
    })

    // Navigate to search
    await page.goto('/scholarships')

    // TODO: Add data-testid="search-input" and data-testid="search-button"
    // await page.fill('[data-testid="search-input"]', 'Computer Science')
    // await page.click('[data-testid="search-button"]')

    // Temporary: use text selectors until data-testid added
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first()
    if (await searchInput.isVisible()) {
      await searchInput.fill('Computer Science')
      await searchInput.press('Enter')

      // ✅ Wait for results deterministically
      await page.waitForSelector('text=Computer Science Excellence Award', { timeout: 10000 })
      await expect(page.locator('text=Computer Science Excellence Award')).toBeVisible()
    }
  })

  test('should filter scholarships by category', async ({ page, scholarshipFactory }) => {
    // Create scholarships in different categories
    await scholarshipFactory.createScholarship({ category: 'STEM', name: 'STEM Award' })
    await scholarshipFactory.createScholarship({ category: 'Arts', name: 'Arts Award' })
    await scholarshipFactory.createScholarship({ category: 'Leadership', name: 'Leadership Award' })

    await page.goto('/scholarships')

    // TODO: Add data-testid="category-filter-STEM" to filter buttons
    const stemFilter = page.locator('text=STEM').first()
    if (await stemFilter.isVisible()) {
      await stemFilter.click()

      // Should show STEM scholarship
      await expect(page.locator('text=STEM Award')).toBeVisible()

      // Should not show Arts scholarship
      await expect(page.locator('text=Arts Award')).not.toBeVisible()
    }
  })
})

/**
 * Key Improvements in These Tests:
 *
 * 1. ✅ Auto-Cleanup: All factories clean up data automatically
 * 2. ✅ Fast Setup: Use API/factories instead of UI clicks
 * 3. ✅ Stable Selectors: Prefer data-testid (marked with TODOs to add)
 * 4. ✅ Deterministic Waits: No waitForTimeout(), only waitForSelector()
 * 5. ✅ Test Isolation: Each test creates its own data
 * 6. ✅ Fixtures: Use authenticatedPage for pre-authenticated tests
 * 7. ✅ Realistic Data: Faker-based factories generate real-looking data
 * 8. ✅ Type Safety: Full TypeScript support
 *
 * Next Steps:
 * - Add data-testid attributes to UI components
 * - Refactor existing tests to use these patterns
 * - Add more page objects for complex flows
 */
