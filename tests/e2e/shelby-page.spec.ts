import { test, expect } from '@playwright/test'

test.describe('/shelby page diagnostics', () => {
  test('should load and display content on /shelby page', async ({ page }) => {
    // Capture console messages and errors
    const consoleMessages: string[] = []
    const consoleErrors: string[] = []

    page.on('console', msg => {
      const text = msg.text()
      consoleMessages.push(`[${msg.type()}] ${text}`)
      if (msg.type() === 'error') {
        consoleErrors.push(text)
      }
    })

    // Capture page errors
    const pageErrors: Error[] = []
    page.on('pageerror', error => {
      pageErrors.push(error)
      console.error('Page error:', error.message)
    })

    // Navigate to /shelby
    console.log('Navigating to /shelby...')
    const response = await page.goto('http://localhost:3000/shelby', {
      waitUntil: 'networkidle',
      timeout: 30000
    })

    // Check response status
    console.log('Response status:', response?.status())
    expect(response?.status()).toBe(200)

    // Wait a bit for any async rendering
    await page.waitForTimeout(2000)

    // Take screenshot for debugging
    await page.screenshot({ path: 'tests/screenshots/shelby-page.png', fullPage: true })
    console.log('Screenshot saved to tests/screenshots/shelby-page.png')

    // Get page title
    const title = await page.title()
    console.log('Page title:', title)

    // Get body text content
    const bodyText = await page.locator('body').textContent()
    console.log('Body text length:', bodyText?.length || 0)
    console.log('Body text preview:', bodyText?.substring(0, 200))

    // Check for common elements
    const mainElement = page.locator('main')
    const mainExists = await mainElement.count()
    console.log('Main element exists:', mainExists > 0)

    // Check for any visible text
    const visibleText = await page.locator('body *:visible').allTextContents()
    console.log('Visible elements with text:', visibleText.length)
    console.log('First few visible texts:', visibleText.slice(0, 10))

    // Log console messages
    console.log('\n=== Console Messages ===')
    consoleMessages.forEach(msg => console.log(msg))

    // Log console errors
    if (consoleErrors.length > 0) {
      console.log('\n=== Console Errors ===')
      consoleErrors.forEach(err => console.log(err))
    }

    // Log page errors
    if (pageErrors.length > 0) {
      console.log('\n=== Page Errors ===')
      pageErrors.forEach(err => console.log(err.message))
    }

    // Get HTML snapshot
    const html = await page.content()
    console.log('\n=== HTML Preview (first 500 chars) ===')
    console.log(html.substring(0, 500))

    // Assertions - check that page has some content
    expect(bodyText).toBeTruthy()
    expect(bodyText!.length).toBeGreaterThan(0)
  })

  test('should check for specific Shelby page elements', async ({ page }) => {
    await page.goto('http://localhost:3000/shelby', {
      waitUntil: 'networkidle',
      timeout: 30000
    })

    await page.waitForTimeout(2000)

    // Check for layout elements
    const hasNav = await page.locator('nav').count()
    const hasHeader = await page.locator('header').count()
    const hasMain = await page.locator('main').count()
    const hasFooter = await page.locator('footer').count()

    console.log('Layout elements:')
    console.log('  - nav:', hasNav > 0)
    console.log('  - header:', hasHeader > 0)
    console.log('  - main:', hasMain > 0)
    console.log('  - footer:', hasFooter > 0)

    // Check for any React error boundaries
    const errorBoundary = await page.locator('[role="alert"]').count()
    console.log('Error boundary visible:', errorBoundary > 0)

    if (errorBoundary > 0) {
      const errorText = await page.locator('[role="alert"]').textContent()
      console.log('Error boundary content:', errorText)
    }

    // Check for loading states
    const loadingSpinner = await page.locator('[aria-label*="loading"], [role="progressbar"]').count()
    console.log('Loading spinner visible:', loadingSpinner > 0)

    // Get all data-testid attributes to see what's rendered
    const testIds = await page.locator('[data-testid]').evaluateAll(
      elements => elements.map(el => el.getAttribute('data-testid'))
    )
    console.log('Elements with data-testid:', testIds)
  })
})
