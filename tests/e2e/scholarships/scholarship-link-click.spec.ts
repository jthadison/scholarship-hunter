/**
 * Scholarship Card Link Click Test
 *
 * Tests that scholarship cards are clickable and navigate to detail pages.
 */

import { test, expect } from '../../support/fixtures'

test.describe('Scholarship Card Click Navigation', () => {
  test.skip('scholarship card should be clickable and navigate to detail page', async ({
    authenticatedPage,
    scholarshipFactory,
  }) => {
    // SKIPPED: These tests require Meilisearch to be running and scholarships to be indexed
    // The scholarship search functionality depends on async Meilisearch indexing
    // Create a test scholarship
    const scholarship = await scholarshipFactory.createScholarship({
      name: 'Test Clickable Scholarship',
      provider: 'Test Provider',
      awardAmount: 5000,
      description: 'This scholarship tests link clickability',
    })

    console.log('Created scholarship:', scholarship.id, scholarship.name)

    // Navigate to search page (requires authentication)
    await authenticatedPage.goto('/scholarships/search')

    // Wait for page header to load instead of networkidle
    await authenticatedPage.waitForSelector('h1:has-text("Search Scholarships")', { timeout: 15000 })

    // Look for the scholarship card by name
    const scholarshipCard = authenticatedPage.locator(`text="${scholarship.name}"`).first()

    // Verify the scholarship is visible
    await expect(scholarshipCard).toBeVisible({ timeout: 10000 })

    console.log('Scholarship card found and visible')

    // Get the parent link element
    const linkElement = authenticatedPage.locator(`a[href="/scholarships/${scholarship.id}"]`).first()

    // Verify link exists
    await expect(linkElement).toBeVisible()

    console.log('Link element found:', `/scholarships/${scholarship.id}`)

    // Click the card
    await linkElement.click()

    // Wait for navigation
    await authenticatedPage.waitForURL(`**/scholarships/${scholarship.id}`, { timeout: 10000 })

    // Verify we're on the detail page
    expect(authenticatedPage.url()).toContain(`/scholarships/${scholarship.id}`)

    console.log('Successfully navigated to:', authenticatedPage.url())
  })

  test.skip('scholarship card should have cursor pointer styling', async ({
    authenticatedPage,
    scholarshipFactory,
  }) => {
    // SKIPPED: Requires Meilisearch indexing
    // Create a test scholarship
    const scholarship = await scholarshipFactory.createScholarship({
      name: 'Cursor Test Scholarship',
      provider: 'Test Provider',
    })

    // Navigate to search page (requires authentication)
    await authenticatedPage.goto('/scholarships/search')

    // Wait for page header to load
    await authenticatedPage.waitForSelector('h1:has-text("Search Scholarships")', { timeout: 15000 })

    // Get the link element
    const linkElement = authenticatedPage.locator(`a[href="/scholarships/${scholarship.id}"]`).first()

    // Verify link exists
    await expect(linkElement).toBeVisible({ timeout: 10000 })

    // Check that the link has cursor-pointer class
    const classes = await linkElement.getAttribute('class')
    expect(classes).toContain('cursor-pointer')

    console.log('Link classes:', classes)
  })

  test.skip('multiple scholarship cards should all be clickable', async ({
    authenticatedPage,
    scholarshipFactory,
  }) => {
    // SKIPPED: Requires Meilisearch indexing
    // Create multiple scholarships
    const scholarships = await Promise.all([
      scholarshipFactory.createScholarship({
        name: 'First Scholarship',
        provider: 'Provider 1',
      }),
      scholarshipFactory.createScholarship({
        name: 'Second Scholarship',
        provider: 'Provider 2',
      }),
      scholarshipFactory.createScholarship({
        name: 'Third Scholarship',
        provider: 'Provider 3',
      }),
    ])

    // Navigate to search page (requires authentication)
    await authenticatedPage.goto('/scholarships/search')

    // Wait for page header to load
    await authenticatedPage.waitForSelector('h1:has-text("Search Scholarships")', { timeout: 15000 })

    // Test clicking each scholarship
    for (const scholarship of scholarships) {
      // Go back to search page
      await authenticatedPage.goto('/scholarships/search')
      await authenticatedPage.waitForSelector('h1:has-text("Search Scholarships")', { timeout: 15000 })

      // Find and click the scholarship
      const linkElement = authenticatedPage.locator(`a[href="/scholarships/${scholarship.id}"]`).first()
      await expect(linkElement).toBeVisible({ timeout: 10000 })

      await linkElement.click()

      // Verify navigation
      await authenticatedPage.waitForURL(`**/scholarships/${scholarship.id}`, { timeout: 10000 })
      expect(authenticatedPage.url()).toContain(`/scholarships/${scholarship.id}`)

      console.log(`Successfully clicked and navigated to: ${scholarship.name}`)
    }
  })
})
