import { test, expect } from '../support/fixtures'

/**
 * Applications Page Tests with Real Authentication
 *
 * Verifies that authenticated users can:
 * - Load the /applications page successfully
 * - View their existing applications
 * - See the Kanban board or mobile list view
 * - Access application filters and controls
 *
 * Prerequisites:
 * - Test user must exist in Clerk (set via TEST_USER_EMAIL)
 * - Test user must have a Student profile in database
 * - Test user should have existing applications for full testing
 */

test.describe('/applications page with authentication', () => {
  test('should load applications page successfully when authenticated', async ({ authenticatedPage }) => {
    // Add console logging to debug
    authenticatedPage.on('console', msg => console.log(`BROWSER ${msg.type()}: ${msg.text()}`))
    authenticatedPage.on('pageerror', error => console.error(`PAGE ERROR: ${error.message}`))

    // Navigate to /applications with longer timeout
    await authenticatedPage.goto('/applications', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    })

    // Verify we're on the applications page (not redirected to sign-in)
    await expect(authenticatedPage).toHaveURL(/\/applications/)

    // Wait for either the heading OR the spinner to disappear
    // This helps us debug if the page is stuck loading
    try {
      await authenticatedPage.waitForSelector('h1', { timeout: 30000 })
    } catch (e) {
      // Take screenshot and log page state for debugging
      console.log('❌ h1 not found after 30s, checking page state...')
      const html = await authenticatedPage.content()
      console.log('Page HTML length:', html.length)
      console.log('Has spinner:', html.includes('animate-spin'))
      throw e
    }

    // Verify page title is visible
    const heading = authenticatedPage.locator('h1', { hasText: 'My Applications' })
    await expect(heading).toBeVisible({ timeout: 10000 })

    // Verify main content is visible (check for breadcrumb navigation)
    const breadcrumb = authenticatedPage.locator('nav', { hasText: 'Home' })
    await expect(breadcrumb).toBeVisible()
  })

  test('should display applications header and navigation elements', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/applications')

    // Verify breadcrumb navigation
    const breadcrumb = authenticatedPage.locator('nav').filter({ hasText: 'Home' })
    await expect(breadcrumb).toBeVisible()

    // Verify "Add Scholarship" button is visible
    const addButton = authenticatedPage.locator('button', { hasText: 'Add Scholarship' })
    await expect(addButton).toBeVisible()

    // Verify "View Archived" toggle button is visible
    const archivedButton = authenticatedPage.locator('button', { hasText: 'View Archived' })
    await expect(archivedButton).toBeVisible()
  })

  test('should display filter bar with filter controls', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/applications')

    // Wait for page to load
    await expect(authenticatedPage.locator('h1')).toBeVisible()

    // Check for filter controls
    // FilterBar should be visible and contain filter options
    const filterSection = authenticatedPage.locator('text="Priority Tier"').or(
      authenticatedPage.locator('text="Deadline Range"')
    ).or(
      authenticatedPage.locator('text="Status"')
    )

    // At least one filter should be visible
    await expect(filterSection.first()).toBeVisible({ timeout: 5000 })
  })

  test('should display applications in Kanban board (desktop) or mobile list', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/applications')

    // Wait for page to load
    await expect(authenticatedPage.locator('h1')).toBeVisible()

    // Check if user has applications or sees empty state
    const hasEmptyState = await authenticatedPage.locator('text="No applications yet"').isVisible()
    const hasFilteredEmptyState = await authenticatedPage.locator('text="No applications match your filters"').isVisible()

    if (hasEmptyState || hasFilteredEmptyState) {
      // Verify empty state message
      const emptyStateButton = authenticatedPage.locator('button', { hasText: 'Browse Scholarships' })
      if (hasEmptyState) {
        await expect(emptyStateButton).toBeVisible()
      }
    } else {
      // Should have applications - check for Kanban columns or mobile list
      const hasKanbanColumns = await authenticatedPage.locator('[data-testid*="column"]').count() > 0
      const hasMobileList = await authenticatedPage.locator('[data-testid*="mobile"]').count() > 0
      const hasApplicationCards = await authenticatedPage.locator('[data-testid*="application"]').count() > 0

      // At least one view should be visible
      const hasApplicationsView = hasKanbanColumns || hasMobileList || hasApplicationCards
      expect(hasApplicationsView).toBeTruthy()
    }
  })

  test('should allow toggling bulk selection mode', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/applications')

    // Wait for page to load
    await expect(authenticatedPage.locator('h1')).toBeVisible()

    // Check if "Select Multiple" button exists (only shown if there are applications)
    const selectButton = authenticatedPage.locator('button', { hasText: 'Select Multiple' })
    const buttonExists = await selectButton.count() > 0

    if (buttonExists) {
      // Click to enable bulk selection
      await selectButton.click()

      // Verify button text changes to "Cancel Selection"
      await expect(authenticatedPage.locator('button', { hasText: 'Cancel Selection' })).toBeVisible()

      // Verify "Select All" button appears
      const selectAllButton = authenticatedPage.locator('button', { hasText: /Select All/ })
      await expect(selectAllButton).toBeVisible()

      // Click again to cancel
      await authenticatedPage.locator('button', { hasText: 'Cancel Selection' }).click()

      // Should revert to "Select Multiple"
      await expect(selectButton).toBeVisible()
    }
  })

  test('should toggle between active and archived applications', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/applications')

    // Wait for page to load
    await expect(authenticatedPage.locator('h1', { hasText: 'My Applications' })).toBeVisible()

    // Click "View Archived" button
    const archivedButton = authenticatedPage.locator('button', { hasText: 'View Archived' })
    await archivedButton.click()

    // Verify header changes to "Archived Applications"
    await expect(authenticatedPage.locator('h1', { hasText: 'Archived Applications' })).toBeVisible()

    // Verify button text changes to "View Active"
    await expect(authenticatedPage.locator('button', { hasText: 'View Active' })).toBeVisible()

    // Click "View Active" to return
    await authenticatedPage.locator('button', { hasText: 'View Active' }).click()

    // Verify we're back to "My Applications"
    await expect(authenticatedPage.locator('h1', { hasText: 'My Applications' })).toBeVisible()
  })

  test('should display at-risk banner when applications are at risk', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/applications')

    // Wait for page to load
    await expect(authenticatedPage.locator('h1')).toBeVisible()

    // Check if at-risk banner is present (optional - depends on data)
    const atRiskBanner = authenticatedPage.locator('[data-testid="at-risk-banner"]').or(
      authenticatedPage.locator('text="applications at risk"')
    )

    const bannerExists = await atRiskBanner.count() > 0

    if (bannerExists) {
      // Verify banner is visible
      await expect(atRiskBanner.first()).toBeVisible()
    }
  })

  test('should navigate to scholarship search when clicking "Add Scholarship"', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/applications')

    // Wait for page to load
    await expect(authenticatedPage.locator('h1')).toBeVisible()

    // Click "Add Scholarship" button
    const addButton = authenticatedPage.locator('button', { hasText: 'Add Scholarship' })
    await addButton.click()

    // Should navigate to /scholarships/search
    await expect(authenticatedPage).toHaveURL(/\/scholarships\/search/, { timeout: 10000 })
  })
})

test.describe('/applications page without authentication (should redirect)', () => {
  test('should redirect to sign-in when not authenticated', async ({ page, context }) => {
    // Clear all cookies to ensure we're not authenticated
    await context.clearCookies()

    // Try to access /applications
    await page.goto('/applications')

    // Should be redirected to sign-in
    await page.waitForURL('**/sign-in**', { timeout: 10000 })
    expect(page.url()).toContain('/sign-in')

    // Verify redirect URL includes return path to /applications
    expect(page.url()).toContain('applications')
  })
})

/**
 * Setup Instructions:
 *
 * 1. Ensure test user exists in Clerk Dashboard:
 *    - Email: j.thadison@gmail.com (or set TEST_USER_EMAIL in .env.test)
 *    - Should have password authentication enabled
 *
 * 2. Ensure test user has Student profile in database:
 *    - Run: npm run db:studio
 *    - Verify Student record exists for the user
 *
 * 3. (Optional) Seed test applications for comprehensive testing:
 *    - Run seed scripts to create sample applications
 *    - Check scripts/test-getByStudent.ts for verification
 *
 * 4. Run the test:
 *    npx playwright test applications-authenticated --project=chromium
 *    npx playwright test applications-authenticated --headed
 */
