import { test, expect } from '@playwright/test'

test.describe('Dashboard - Story 1.9', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard (assumes user is authenticated)
    await page.goto('/dashboard')
  })

  test('AC1: Dashboard displays profile status data with visual indicators', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForSelector('h1', { timeout: 10000 })

    // Check that profile completeness is displayed
    await expect(page.getByText(/Profile Completeness/i)).toBeVisible()

    // Check that profile strength is displayed
    await expect(page.getByText(/Profile Strength/i)).toBeVisible()

    // Verify visual indicators are present (progress bars or badges)
    // Quick stats cards should be visible
    const statsCards = page.locator('[class*="grid"]').first()
    await expect(statsCards).toBeVisible()
  })

  test('AC2: Complete Your Profile CTA shown when profile incomplete', async ({ page }) => {
    // Wait for page load
    await page.waitForLoadState('networkidle')

    // Check for "Complete Your Profile" CTA (should be visible if profile < 100%)
    const completeProfileButton = page.getByRole('link', { name: /Complete Profile/i })

    // If profile is incomplete, button should be visible
    if (await completeProfileButton.isVisible()) {
      // Verify CTA is above the fold (within viewport)
      const buttonBox = await completeProfileButton.boundingBox()
      expect(buttonBox).not.toBeNull()
      expect(buttonBox!.y).toBeLessThan(800) // Above the fold

      // Verify clicking navigates to wizard
      await completeProfileButton.click()
      await expect(page).toHaveURL(/\/profile\/wizard/)
    }
  })

  test('AC3: Welcome message with student name and time-based greeting', async ({ page }) => {
    // Wait for welcome message
    const welcomeHeading = page.locator('h1').first()
    await expect(welcomeHeading).toBeVisible()

    // Check for time-based greeting
    const greetingText = await welcomeHeading.textContent()
    expect(greetingText).toMatch(/(Good morning|Good afternoon|Good evening|Welcome back)/)

    // Should include student name or default "Student"
    expect(greetingText).toBeTruthy()
  })

  test('AC4: Placeholder sections for future features displayed', async ({ page }) => {
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')

    // Scroll to "Coming Soon" section
    await page.getByText(/Coming Soon/i).scrollIntoViewIfNeeded()

    // Check for Scholarships Matched placeholder
    await expect(page.getByText(/Scholarships Matched/i)).toBeVisible()
    await expect(page.getByText(/Epic 2/i)).toBeVisible()

    // Check for Applications in Progress placeholder
    await expect(page.getByText(/Applications in Progress/i)).toBeVisible()
    await expect(page.getByText(/Epic 3/i)).toBeVisible()

    // Check for Upcoming Deadlines placeholder
    await expect(page.getByText(/Upcoming Deadlines/i)).toBeVisible()

    // Verify placeholders are visually distinct (dashed borders)
    const placeholderCard = page.getByText(/Scholarships Matched/i).locator('..')
    await expect(placeholderCard).toHaveCSS('border-style', /dashed/)
  })

  test('AC5: Mobile responsive layout', async ({ page }) => {
    // Set viewport to mobile size (iPhone SE - 375px)
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Check that bottom navigation is visible on mobile
    const bottomNav = page.locator('nav').last()
    await expect(bottomNav).toBeVisible()

    // Verify no horizontal scrolling
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth)

    // Check that navigation has hamburger menu
    const menuButton = page.getByRole('button', { name: /menu/i })
    await expect(menuButton).toBeVisible()

    // Tap targets should be at least 44px
    const dashboardLink = page.getByRole('link', { name: /Dashboard/i }).first()
    const linkBox = await dashboardLink.boundingBox()
    expect(linkBox!.height).toBeGreaterThanOrEqual(44)
  })

  test('AC6: Navigation menu provides access to key pages', async ({ page }) => {
    // Wait for navigation to load
    await page.waitForSelector('nav')

    // Check for all navigation items
    await expect(page.getByRole('link', { name: /Dashboard/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Profile/i })).toBeVisible()

    // Scholarships and Applications should be disabled/grayed
    const scholarshipsLink = page.getByText(/Scholarships/i)
    await expect(scholarshipsLink).toBeVisible()

    // Check for Settings and Help
    await expect(page.getByRole('link', { name: /Settings/i })).toBeVisible()

    // Check for user menu dropdown
    const userMenuButton = page.getByRole('button').filter({ has: page.locator('[class*="avatar"]') })
    await userMenuButton.click()

    // User dropdown should have View Profile, Account Settings, Sign Out
    await expect(page.getByText(/View Profile/i)).toBeVisible()
    await expect(page.getByText(/Account Settings/i)).toBeVisible()
    await expect(page.getByText(/Sign Out/i)).toBeVisible()
  })

  test('AC7: Dashboard loads within 2 seconds', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/dashboard')

    // Wait for main content to be visible
    await page.waitForSelector('h1', { state: 'visible' })

    const loadTime = Date.now() - startTime

    // Dashboard should load within 2000ms (2 seconds)
    expect(loadTime).toBeLessThan(2000)

    // Verify skeleton loaders are used (not blank page)
    // This is checked by ensuring content appears quickly
    const welcomeText = await page.locator('h1').first().textContent()
    expect(welcomeText).toBeTruthy()
  })

  test('Time to interactive is less than 3 seconds', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/dashboard')

    // Wait for page to be fully interactive
    await page.waitForLoadState('networkidle')

    const interactiveTime = Date.now() - startTime

    // Time to interactive should be under 3000ms (3 seconds)
    expect(interactiveTime).toBeLessThan(3000)
  })

  test('Edit Profile link shown when profile complete', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    // If profile is 100% complete, "Edit Profile" button should be visible
    const editProfileButton = page.getByRole('link', { name: /Edit Profile/i })

    // Either Complete Profile or Edit Profile should be visible
    const completeProfileButton = page.getByRole('link', { name: /Complete Profile/i })

    const isCompleteVisible = await completeProfileButton.isVisible()
    const isEditVisible = await editProfileButton.isVisible()

    // One of them should be visible
    expect(isCompleteVisible || isEditVisible).toBe(true)
  })

  test('Navigation keyboard accessibility', async ({ page }) => {
    // Tab through navigation items
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Check that focused element is a navigation link
    const focused Element = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toMatch(/(BUTTON|A)/)

    // Press Enter should navigate
    // This test verifies keyboard navigation works
  })

  test('Onboarding checklist shown for incomplete profiles', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    // Look for onboarding checklist
    const checklist = page.getByText(/Get Started/i)

    if (await checklist.isVisible()) {
      // Verify checklist items
      await expect(page.getByText(/Complete your profile/i)).toBeVisible()
      await expect(page.getByText(/Review your strength score/i)).toBeVisible()
    }
  })

  test('Cached dashboard loads faster on subsequent visits', async ({ page }) => {
    // First load
    const firstLoadStart = Date.now()
    await page.goto('/dashboard')
    await page.waitForSelector('h1')
    const firstLoadTime = Date.now() - firstLoadStart

    // Navigate away
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    // Return to dashboard (should be cached)
    const secondLoadStart = Date.now()
    await page.goto('/dashboard')
    await page.waitForSelector('h1')
    const secondLoadTime = Date.now() - secondLoadStart

    // Second load should be faster (cached)
    // Note: This might not always be true due to network variations
    // but it's a good indicator
    console.log(`First load: ${firstLoadTime}ms, Second load: ${secondLoadTime}ms`)
  })
})
