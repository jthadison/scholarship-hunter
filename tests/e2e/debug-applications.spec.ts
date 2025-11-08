import { test, expect } from '@playwright/test'

test.describe('Debug Applications Page', () => {
  test('should load applications page and check for errors', async ({ page }) => {
    // Enable console logging
    page.on('console', (msg) => {
      console.log(`BROWSER ${msg.type()}: ${msg.text()}`)
    })

    // Enable error logging
    page.on('pageerror', (error) => {
      console.error(`PAGE ERROR: ${error.message}`)
      console.error(error.stack)
    })

    // Enable request logging
    page.on('request', (request) => {
      console.log(`REQUEST: ${request.method()} ${request.url()}`)
    })

    // Enable response logging (especially errors)
    page.on('response', (response) => {
      if (response.status() >= 400) {
        console.error(`FAILED RESPONSE: ${response.status()} ${response.url()}`)
      }
    })

    // Navigate to the applications page
    console.log('Navigating to /applications...')
    await page.goto('http://localhost:3001/applications', {
      waitUntil: 'domcontentloaded',
      timeout: 10000,
    })

    // Wait a bit to see what happens
    await page.waitForTimeout(3000)

    // Check if we're still on a loading state
    const spinner = page.locator('[class*="animate-spin"]')
    const spinnerVisible = await spinner.isVisible().catch(() => false)

    console.log(`Spinner visible: ${spinnerVisible}`)

    // Check for error messages
    const errorText = await page.locator('text=/error|unable|failed/i').first().textContent().catch(() => null)
    if (errorText) {
      console.log(`Error message found: ${errorText}`)
    }

    // Take a screenshot
    await page.screenshot({ path: 'tests/screenshots/applications-debug.png', fullPage: true })
    console.log('Screenshot saved to tests/screenshots/applications-debug.png')

    // Get the current URL
    console.log(`Current URL: ${page.url()}`)

    // Get page content
    const content = await page.content()
    console.log(`Page contains "My Applications": ${content.includes('My Applications')}`)
    console.log(`Page contains "Sign in": ${content.includes('Sign in') || content.includes('sign-in')}`)

    // Check if we got redirected to sign-in
    if (page.url().includes('sign-in')) {
      console.log('⚠️ User is not authenticated - redirected to sign-in')
    }

    // If spinner is visible, something is stuck
    if (spinnerVisible) {
      console.error('❌ SPINNER IS STUCK - Page is in infinite loading state')
    } else {
      console.log('✅ No spinner found - page loaded')
    }
  })
})
