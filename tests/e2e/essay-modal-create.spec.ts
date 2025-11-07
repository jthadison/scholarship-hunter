import { test, expect } from '../support/fixtures'

/**
 * Essay Creation Modal Test
 *
 * Tests the "Add Optional Essay" button workflow:
 * 1. Opens the modal
 * 2. Creates an essay
 * 3. Navigates to the essay editor
 */

test.describe('Essay Creation Modal', () => {
  test('should create essay and navigate to editor', async ({ authenticatedPage }) => {
    // Enable console logging
    authenticatedPage.on('console', msg => console.log(`BROWSER ${msg.type()}: ${msg.text()}`))
    authenticatedPage.on('pageerror', error => console.error(`PAGE ERROR: ${error.message}`))

    // Navigate to an application workspace (using one of the test applications)
    // First, go to applications page to get an application ID
    await authenticatedPage.goto('/applications')
    await expect(authenticatedPage.locator('h1')).toBeVisible({ timeout: 10000 })

    // Find an application card and click it
    const applicationCard = authenticatedPage.locator('[data-testid*="application"]').first()
    const hasApplication = await applicationCard.count() > 0

    if (!hasApplication) {
      console.log('No applications found, skipping test')
      test.skip()
      return
    }

    // Click the first application to go to its workspace
    await applicationCard.click()

    // Wait for workspace to load
    await expect(authenticatedPage.locator('h1')).toBeVisible({ timeout: 10000 })

    // Find and click "Add Optional Essay" button
    const addEssayButton = authenticatedPage.locator('button', { hasText: 'Add Optional Essay' })
      .or(authenticatedPage.locator('button', { hasText: 'Add Another Essay' }))

    await expect(addEssayButton.first()).toBeVisible({ timeout: 5000 })
    await addEssayButton.first().click()

    // Verify modal opened
    await expect(authenticatedPage.locator('text="Add Essay"')).toBeVisible()

    // Fill in essay details
    const essayTitle = `Test Essay ${Date.now()}`
    const essayPrompt = 'This is a test essay prompt that is longer than 10 characters to pass validation.'

    await authenticatedPage.fill('input[id="essay-title"]', essayTitle)
    await authenticatedPage.fill('textarea[id="essay-prompt"]', essayPrompt)

    // Click Create Essay button
    const createButton = authenticatedPage.locator('button[type="submit"]', { hasText: 'Create Essay' })
    await createButton.click()

    // Wait for navigation to essay editor
    await authenticatedPage.waitForURL(/\/dashboard\/essays\/.*/, { timeout: 15000 })

    // Verify we're on the essay editor page
    expect(authenticatedPage.url()).toContain('/dashboard/essays/')

    // Verify the essay editor loaded
    await expect(authenticatedPage.locator('h1', { hasText: essayTitle })).toBeVisible({ timeout: 10000 })
  })
})
