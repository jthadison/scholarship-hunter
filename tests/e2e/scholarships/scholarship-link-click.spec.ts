/**
 * Scholarship Card Link Click Test
 *
 * Tests that scholarship cards are clickable and navigate to detail pages.
 */

import { test, expect } from '../../support/fixtures'

test.describe('Scholarship Card Click Navigation', () => {
  test('scholarship card should be clickable and navigate to detail page', async ({
    page,
    scholarshipFactory,
  }) => {
    // Create a test scholarship
    const scholarship = await scholarshipFactory.createScholarship({
      name: 'Test Clickable Scholarship',
      provider: 'Test Provider',
      awardAmount: 5000,
      description: 'This scholarship tests link clickability',
    })

    console.log('Created scholarship:', scholarship.id, scholarship.name)

    // Navigate to search page
    await page.goto('/scholarships/search')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Look for the scholarship card by name
    const scholarshipCard = page.locator(`text="${scholarship.name}"`).first()

    // Verify the scholarship is visible
    await expect(scholarshipCard).toBeVisible({ timeout: 10000 })

    console.log('Scholarship card found and visible')

    // Get the parent link element
    const linkElement = page.locator(`a[href="/scholarships/${scholarship.id}"]`).first()

    // Verify link exists
    await expect(linkElement).toBeVisible()

    console.log('Link element found:', `/scholarships/${scholarship.id}`)

    // Click the card
    await linkElement.click()

    // Wait for navigation
    await page.waitForURL(`**/scholarships/${scholarship.id}`, { timeout: 10000 })

    // Verify we're on the detail page
    expect(page.url()).toContain(`/scholarships/${scholarship.id}`)

    console.log('Successfully navigated to:', page.url())
  })

  test('scholarship card should have cursor pointer styling', async ({
    page,
    scholarshipFactory,
  }) => {
    // Create a test scholarship
    const scholarship = await scholarshipFactory.createScholarship({
      name: 'Cursor Test Scholarship',
      provider: 'Test Provider',
    })

    // Navigate to search page
    await page.goto('/scholarships/search')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Get the link element
    const linkElement = page.locator(`a[href="/scholarships/${scholarship.id}"]`).first()

    // Verify link exists
    await expect(linkElement).toBeVisible({ timeout: 10000 })

    // Check that the link has cursor-pointer class
    const classes = await linkElement.getAttribute('class')
    expect(classes).toContain('cursor-pointer')

    console.log('Link classes:', classes)
  })

  test('multiple scholarship cards should all be clickable', async ({
    page,
    scholarshipFactory,
  }) => {
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

    // Navigate to search page
    await page.goto('/scholarships/search')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Test clicking each scholarship
    for (const scholarship of scholarships) {
      // Go back to search page
      await page.goto('/scholarships/search')
      await page.waitForLoadState('networkidle')

      // Find and click the scholarship
      const linkElement = page.locator(`a[href="/scholarships/${scholarship.id}"]`).first()
      await expect(linkElement).toBeVisible({ timeout: 10000 })

      await linkElement.click()

      // Verify navigation
      await page.waitForURL(`**/scholarships/${scholarship.id}`, { timeout: 10000 })
      expect(page.url()).toContain(`/scholarships/${scholarship.id}`)

      console.log(`Successfully clicked and navigated to: ${scholarship.name}`)
    }
  })
})
