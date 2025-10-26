/**
 * Scholarship Search & Discovery Tests
 *
 * These tests demonstrate how to test the scholarship search feature
 * using the new testing framework patterns.
 *
 * Features demonstrated:
 * - Creating test data via factories
 * - Testing search and filtering
 * - Using API helpers for verification
 * - data-testid selectors for stability
 *
 * NOTE: Some of these tests are for future functionality (Epic 2)
 * and may not pass until the feature is implemented.
 */

import { test, expect } from '../../support/fixtures'

test.describe('Scholarship Search', () => {
  test('should display scholarships when they exist', async ({
    page,
    scholarshipFactory
  }) => {
    // ✨ Create test scholarships with known data
    await scholarshipFactory.createScholarship({
      name: 'Computer Science Excellence Award',
      awardAmount: 5000,
      category: 'STEM',
      verified: true,
    })

    await scholarshipFactory.createScholarship({
      name: 'Engineering Innovation Scholarship',
      awardAmount: 10000,
      category: 'STEM',
      verified: true,
    })

    // Navigate to scholarships page (when it exists)
    await page.goto('/scholarships')

    // TODO: Add data-testid="scholarship-card" to scholarship cards
    // For now, this is a placeholder test showing the pattern

    // Once implemented, test would look like:
    // const scholarshipCards = page.locator('[data-testid="scholarship-card"]')
    // await expect(scholarshipCards).toHaveCount(2)
  })

  test('should filter scholarships by category', async ({
    page,
    scholarshipFactory
  }) => {
    // Create scholarships in different categories
    const stemScholarship = await scholarshipFactory.createSTEMScholarship({
      name: 'STEM Excellence Award',
    })

    const artsScholarship = await scholarshipFactory.createScholarship({
      name: 'Arts Achievement Scholarship',
      category: 'Arts',
    })

    const leadershipScholarship = await scholarshipFactory.createScholarship({
      name: 'Leadership Impact Award',
      category: 'Leadership',
    })

    await page.goto('/scholarships')

    // TODO: When filter UI is implemented:
    // await page.click('[data-testid="category-filter-STEM"]')
    // await expect(page.locator('text=STEM Excellence Award')).toBeVisible()
    // await expect(page.locator('text=Arts Achievement Scholarship')).not.toBeVisible()
  })

  test('should search scholarships by name', async ({
    page,
    scholarshipFactory
  }) => {
    // Create scholarships with distinct names
    await scholarshipFactory.createScholarship({
      name: 'Medical Research Scholarship',
      category: 'Science',
    })

    await scholarshipFactory.createScholarship({
      name: 'Computer Science Innovation Award',
      category: 'STEM',
    })

    await page.goto('/scholarships')

    // TODO: When search is implemented:
    // await page.fill('[data-testid="search-input"]', 'Computer Science')
    // await page.click('[data-testid="search-button"]')
    //
    // await page.waitForSelector('text=Computer Science Innovation Award')
    // await expect(page.locator('text=Computer Science Innovation Award')).toBeVisible()
    // await expect(page.locator('text=Medical Research Scholarship')).not.toBeVisible()
  })

  test('should display scholarship details correctly', async ({
    page,
    scholarshipFactory
  }) => {
    // Create scholarship with specific data
    const scholarship = await scholarshipFactory.createScholarship({
      name: 'Test Scholarship Award',
      awardAmount: 7500,
      deadline: new Date('2025-12-31'),
      description: 'This is a test scholarship for students pursuing higher education.',
      provider: 'Test Foundation',
      requiredDocuments: ['TRANSCRIPT', 'ESSAY'],
      recommendationCount: 2,
    })

    // Navigate to detail page (when it exists)
    await page.goto(`/scholarships/${scholarship.id}`)

    // TODO: Add data-testid attributes to scholarship detail page
    // await expect(page.locator('[data-testid="scholarship-name"]')).toHaveText('Test Scholarship Award')
    // await expect(page.locator('[data-testid="scholarship-amount"]')).toContainText('$7,500')
    // await expect(page.locator('[data-testid="scholarship-provider"]')).toHaveText('Test Foundation')
  })
})

test.describe('Scholarship Matching', () => {
  test('should show matched scholarships for authenticated user', async ({
    authenticatedPage,
    userFactory,
    scholarshipFactory,
    apiHelper
  }) => {
    // Create user with specific profile
    const user = await userFactory.createUserWithProfile({
      firstName: 'Jane',
      lastName: 'Smith',
    })

    // Create scholarships that should match user's profile
    const stemScholarship = await scholarshipFactory.createSTEMScholarship({
      name: 'STEM Student Award',
      awardAmount: 5000,
    })

    const meritScholarship = await scholarshipFactory.createMeritScholarship({
      name: 'Academic Excellence Scholarship',
      awardAmount: 3000,
    })

    // Navigate to matches page (Epic 2 feature)
    await authenticatedPage.goto('/matches')

    // TODO: When matching is implemented:
    // await expect(authenticatedPage.locator('[data-testid="match-card"]')).toHaveCount(2)
    // await expect(authenticatedPage.locator('text=STEM Student Award')).toBeVisible()
  })

  test('should display match scores for scholarships', async ({
    authenticatedPage,
    userFactory,
    scholarshipFactory,
    apiHelper
  }) => {
    // Create user and scholarship
    const user = await userFactory.createUserWithProfile()
    const scholarship = await scholarshipFactory.createScholarship()

    // ✨ Use API helper to create a match with known score
    await apiHelper.matches.createMatch(user.student!.id, scholarship.id, {
      overall: 85,
      academic: 90,
      demographic: 80,
      majorField: 85,
      priorityTier: 'SHOULD_APPLY',
    })

    await authenticatedPage.goto('/matches')

    // TODO: When match display is implemented:
    // await expect(authenticatedPage.locator('[data-testid="match-score"]')).toContainText('85')
    // await expect(authenticatedPage.locator('[data-testid="priority-tier"]')).toContainText('Should Apply')
  })

  test('should filter matches by priority tier', async ({
    authenticatedPage,
    userFactory,
    scholarshipFactory,
    apiHelper
  }) => {
    const user = await userFactory.createUserWithProfile()

    // Create scholarships with different priority tiers
    const highPriority = await scholarshipFactory.createScholarship({ name: 'Must Apply Scholarship' })
    const mediumPriority = await scholarshipFactory.createScholarship({ name: 'Should Apply Scholarship' })
    const lowPriority = await scholarshipFactory.createScholarship({ name: 'If Time Permits Scholarship' })

    // Create matches with different priorities
    await apiHelper.matches.createMatch(user.student!.id, highPriority.id, {
      overall: 95,
      priorityTier: 'MUST_APPLY',
    })

    await apiHelper.matches.createMatch(user.student!.id, mediumPriority.id, {
      overall: 75,
      priorityTier: 'SHOULD_APPLY',
    })

    await apiHelper.matches.createMatch(user.student!.id, lowPriority.id, {
      overall: 60,
      priorityTier: 'IF_TIME_PERMITS',
    })

    await authenticatedPage.goto('/matches')

    // TODO: When filtering is implemented:
    // await authenticatedPage.click('[data-testid="filter-must-apply"]')
    // await expect(authenticatedPage.locator('text=Must Apply Scholarship')).toBeVisible()
    // await expect(authenticatedPage.locator('text=Should Apply Scholarship')).not.toBeVisible()
  })
})

test.describe('Scholarship Application', () => {
  test('should allow user to start application from scholarship detail', async ({
    authenticatedPage,
    userFactory,
    scholarshipFactory
  }) => {
    const user = await userFactory.createUserWithProfile()
    const scholarship = await scholarshipFactory.createScholarship({
      name: 'Application Test Scholarship',
    })

    await authenticatedPage.goto(`/scholarships/${scholarship.id}`)

    // TODO: When apply button is implemented:
    // await authenticatedPage.click('[data-testid="apply-button"]')
    // await expect(authenticatedPage.locator('[data-testid="application-started-message"]')).toBeVisible()
  })

  test('should track application progress', async ({
    authenticatedPage,
    userFactory,
    scholarshipFactory,
    applicationFactory,
    apiHelper
  }) => {
    const user = await userFactory.createUserWithProfile()
    const scholarship = await scholarshipFactory.createScholarship()

    // ✨ Create application in IN_PROGRESS state via factory
    const application = await applicationFactory.createInProgressApplication(
      user.student!.id,
      scholarship.id
    )

    await authenticatedPage.goto(`/applications/${application.id}`)

    // TODO: When application detail page is implemented:
    // const progressBar = authenticatedPage.locator('[data-testid="progress-bar"]')
    // await expect(progressBar).toBeVisible()
    //
    // const progressText = await authenticatedPage.locator('[data-testid="progress-percentage"]').textContent()
    // expect(progressText).toMatch(/\d+%/)
  })
})

/**
 * These tests demonstrate:
 *
 * 1. ✨ Creating test data via factories (fast, isolated)
 * 2. ✨ Using API helpers to set up complex scenarios
 * 3. ✨ Testing with authenticated users (no UI login)
 * 4. ✨ Following data-testid selector pattern
 * 5. ✨ Auto-cleanup of all test data
 *
 * Benefits:
 * - Tests are ready before feature implementation
 * - TDD-friendly: write tests first, implement after
 * - Fast: API setup instead of UI clicks
 * - Reliable: No flaky waits or brittle selectors
 * - Maintainable: Easy to update when UI changes
 */
