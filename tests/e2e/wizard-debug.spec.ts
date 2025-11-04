/**
 * Debug test to isolate wizard navigation issue
 */

import { test, expect } from '../support/fixtures'

test('debug: clicking Get Started button', async ({ authenticatedPage }) => {
  // Listen for console messages
  authenticatedPage.on('console', msg => {
    console.log(`BROWSER ${msg.type()}: ${msg.text()}`)
  })

  // Listen for page errors
  authenticatedPage.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message)
  })

  // Listen for failed requests
  authenticatedPage.on('requestfailed', request => {
    console.log(`REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`)
  })

  // Clear localStorage
  await authenticatedPage.goto('/dashboard')
  await authenticatedPage.evaluate(() => {
    localStorage.removeItem('profile-wizard-storage')
  })

  // Navigate to wizard
  await authenticatedPage.goto('/profile/wizard', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  })

  // Wait for Welcome heading
  await authenticatedPage.waitForSelector('h1:has-text("Welcome")', { timeout: 15000 })
  console.log('===== WELCOME STEP LOADED =====')

  // Check localStorage before click
  const beforeClick = await authenticatedPage.evaluate(() => {
    return localStorage.getItem('profile-wizard-storage')
  })
  console.log('===== LOCALSTORAGE BEFORE CLICK =====')
  console.log(beforeClick)

  // Click Get Started
  console.log('===== CLICKING GET STARTED =====')
  await authenticatedPage.getByRole('button', { name: /Get Started/i }).click()

  // Wait a bit
  await authenticatedPage.waitForTimeout(2000)

  // Check localStorage after click
  const afterClick = await authenticatedPage.evaluate(() => {
    return localStorage.getItem('profile-wizard-storage')
  })
  console.log('===== LOCALSTORAGE AFTER CLICK =====')
  console.log(afterClick)

  // Check for step 1 elements
  const hasStep1Text = await authenticatedPage.locator('text=/Step 1 of 5/i').count()
  const hasAcademicHeading = await authenticatedPage.locator('h1:has-text("Academic")').count()
  const hasLoadingSpinner = await authenticatedPage.locator('[class*="animate-spin"]').count()

  console.log('===== AFTER CLICK ELEMENT COUNTS =====')
  console.log('Step 1 text:', hasStep1Text)
  console.log('Academic heading:', hasAcademicHeading)
  console.log('Loading spinner:', hasLoadingSpinner)

  // Get body text
  const bodyText = await authenticatedPage.textContent('body')
  console.log('===== BODY TEXT (first 500 chars) =====')
  console.log(bodyText?.substring(0, 500))

  // Take screenshot
  await authenticatedPage.screenshot({ path: 'wizard-after-click.png', fullPage: true })
  console.log('Screenshot saved to wizard-after-click.png')
})
