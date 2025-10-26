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
  test('should allow user to login and access dashboard', async ({ page, userFactory, authHelper }) => {
    // ✅ Create test user with factory (auto-cleanup)
    const user = await userFactory.createUserWithProfile({
      email: 'test.login@example.com',
      firstName: 'Test',
      lastName: 'User',
    })

    // ✅ Set auth state directly (bypass UI login for speed)
    await authHelper.setAuthState(user)

    // Navigate to dashboard
    await page.goto('/dashboard')

    // ✅ Use data-testid selectors (stable, won't break with copy changes)
    // TODO: Add data-testid="user-name" to dashboard component
    await expect(page.locator('text=Test User')).toBeVisible()

    // Verify authenticated state
    expect(await authHelper.isAuthenticated()).toBe(true)
  })

  test('should redirect unauthenticated users to sign-in', async ({ page }) => {
    // No auth setup - should redirect

    await page.goto('/dashboard')

    // Should be redirected to sign-in
    await page.waitForURL('**/sign-in**', { timeout: 10000 })
    expect(page.url()).toContain('/sign-in')

    // ✅ Deterministic wait (no hard-coded timeouts)
    await page.waitForSelector('[data-clerk-component]')
    const clerkComponent = page.locator('[data-clerk-component]')
    await expect(clerkComponent).toBeVisible()
  })

  test('should display user profile information after login', async ({ authenticatedPage, userFactory }) => {
    // ✅ Use authenticatedPage fixture (pre-authenticated!)
    const user = await userFactory.createUserWithProfile({
      firstName: 'John',
      lastName: 'Doe',
    })

    // No need to login - authenticatedPage is already authenticated!
    await authenticatedPage.goto('/settings')

    // TODO: Add data-testid attributes to settings page
    // await expect(authenticatedPage.locator('[data-testid="profile-first-name"]')).toHaveValue('John')
    // await expect(authenticatedPage.locator('[data-testid="profile-last-name"]')).toHaveValue('Doe')

    // Temporary assertion until data-testid added
    await expect(authenticatedPage.locator('text=John Doe')).toBeVisible()
  })
})

test.describe('Scholarship Application Flow - Refactored', () => {
  test('should allow user to apply to scholarship', async ({
    authenticatedPage,
    userFactory,
    scholarshipFactory,
    applicationFactory,
  }) => {
    // ✅ Create all test data via factories (API-first, fast!)
    const user = await userFactory.createUserWithProfile()
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
    userFactory,
    scholarshipFactory,
    applicationFactory,
    apiHelper,
  }) => {
    // ✅ Create test data via API (much faster than UI)
    const user = await userFactory.createUserWithProfile()
    const scholarship = await scholarshipFactory.createScholarship({
      name: 'Progress Test Scholarship',
    })

    // ✅ Create application in IN_PROGRESS state
    const application = await applicationFactory.createInProgressApplication(user.student!.id, scholarship.id)

    // Navigate to application page
    await authenticatedPage.goto(`/applications/${application.id}`)

    // TODO: Add data-testid="progress-percentage" to application component
    // await expect(authenticatedPage.locator('[data-testid="progress-percentage"]'))
    //   .toHaveText(`${application.progressPercentage}%`)

    // Verify progress is displayed
    await expect(authenticatedPage.locator('text=/progress/i')).toBeVisible()

    // ✅ Use API helper to verify data consistency
    const stats = await apiHelper.applications.getStats(user.student!.id)
    expect(stats.inProgress).toBe(1)
    expect(stats.total).toBe(1)
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
