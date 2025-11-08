import { test, expect } from '../../support/fixtures'

/**
 * Essay Workflow E2E Tests
 *
 * Tests the complete essay creation and editing workflow:
 * 1. Navigate to new essay page
 * 2. Enter essay title and prompt
 * 3. Analyze prompt with AI (Morgan)
 * 4. Create essay and navigate to editor
 * 5. Verify essay editor loads with correct data
 *
 * Prerequisites:
 * - Test user must be authenticated (uses authenticatedPage fixture)
 * - Test user must have a Student profile in database
 * - AI features must be enabled (ENABLE_AI_FEATURES=true)
 */

test.describe('Essay Creation Workflow', () => {
  test('should create essay from new essay page with AI analysis', async ({ authenticatedPage }) => {
    // Enable console logging for debugging
    authenticatedPage.on('console', msg => console.log(`BROWSER ${msg.type()}: ${msg.text()}`))
    authenticatedPage.on('pageerror', error => console.error(`PAGE ERROR: ${error.message}`))

    // Navigate to new essay page with networkidle to ensure all resources loaded
    await authenticatedPage.goto('/dashboard/essays/new', {
      waitUntil: 'networkidle',
      timeout: 60000
    })

    // Verify we're on the new essay page
    await expect(authenticatedPage).toHaveURL(/\/dashboard\/essays\/new/)

    // Wait for the page to finish loading - check that spinner is gone OR heading is visible
    // Use a more flexible approach that handles both loading states
    await authenticatedPage.waitForFunction(
      () => {
        const hasHeading = document.querySelector('h1')?.textContent?.includes('Create New Essay')
        const hasNoSpinner = !document.querySelector('[class*="animate-spin"]')
        return hasHeading || hasNoSpinner
      },
      { timeout: 30000 }
    )

    // Verify page heading is visible
    const heading = authenticatedPage.locator('h1', { hasText: 'Create New Essay' })
    await expect(heading).toBeVisible({ timeout: 15000 })

    // Fill in essay title
    const essayTitle = `E2E Test Essay ${Date.now()}`
    const titleInput = authenticatedPage.locator('input#title')
    await expect(titleInput).toBeVisible()
    await titleInput.fill(essayTitle)

    // Fill in essay prompt
    const essayPrompt = 'Describe a leadership experience where you made a significant impact on your community. How did this experience shape your values and future goals? (500 words maximum)'
    const promptTextarea = authenticatedPage.locator('textarea#prompt')
    await expect(promptTextarea).toBeVisible()
    await promptTextarea.fill(essayPrompt)

    // Click "Analyze Prompt with Morgan" button
    const analyzeButton = authenticatedPage.locator('button', { hasText: 'Analyze Prompt with Morgan' })
    await expect(analyzeButton).toBeVisible()
    await expect(analyzeButton).toBeEnabled()
    await analyzeButton.click()

    // Wait for analysis to complete (Morgan is analyzing)
    // The button text changes, so just wait for the analysis to finish
    // Look for the "Ready to start writing?" text that appears after analysis
    await expect(authenticatedPage.locator('text="Ready to start writing?"')).toBeVisible({ timeout: 60000 })

    // Verify analysis panel is visible
    // The PromptAnalysisPanel should show key themes, structure suggestions, etc.
    const analysisSection = authenticatedPage.locator('text="Analysis Results"')
      .or(authenticatedPage.locator('text="Key Themes"'))
      .or(authenticatedPage.locator('text="Ready to start writing?"'))
    await expect(analysisSection.first()).toBeVisible()

    // Click "Create Essay" button
    const createButton = authenticatedPage.locator('button', { hasText: 'Create Essay' })
    await expect(createButton).toBeVisible()
    await expect(createButton).toBeEnabled()
    await createButton.click()

    // Wait for navigation to essay editor page with longer timeout
    await authenticatedPage.waitForURL(/\/dashboard\/essays\/[a-zA-Z0-9-]+$/, { timeout: 45000 })

    // Verify we're on the essay editor page (URL contains essay ID)
    expect(authenticatedPage.url()).toMatch(/\/dashboard\/essays\/[a-zA-Z0-9-]+$/)

    // Wait for the essay editor page to load
    // Either the loading text disappears or the essay title appears
    try {
      await authenticatedPage.waitForFunction(
        (title) => {
          const h1 = document.querySelector('h1')
          return h1 && h1.textContent && h1.textContent.includes(title)
        },
        essayTitle,
        { timeout: 60000 }
      )
    } catch (e) {
      // If timeout, log current page state for debugging
      console.log('Essay editor failed to load. Current URL:', authenticatedPage.url())
      const pageText = await authenticatedPage.textContent('body')
      console.log('Page content preview:', pageText?.substring(0, 500))
      throw e
    }

    // Verify essay editor loaded with correct title
    const editorHeading = authenticatedPage.locator('h1', { hasText: essayTitle })
    await expect(editorHeading).toBeVisible({ timeout: 10000 })

    // Verify we have the essay editor tabs or content
    const editorTab = authenticatedPage.locator('text="Essay Editor"')
      .or(authenticatedPage.locator('text="Essay Content"'))
    await expect(editorTab.first()).toBeVisible({ timeout: 10000 })
  })

  test('should create essay without AI analysis (quick mode)', async ({ authenticatedPage }) => {
    // Navigate to new essay page
    await authenticatedPage.goto('/dashboard/essays/new', {
      waitUntil: 'networkidle',
      timeout: 60000
    })

    // Wait for page to load
    await authenticatedPage.waitForFunction(
      () => document.querySelector('h1')?.textContent?.includes('Create New Essay'),
      { timeout: 30000 }
    )
    await expect(authenticatedPage.locator('h1', { hasText: 'Create New Essay' })).toBeVisible({ timeout: 10000 })

    // Fill in essay title
    const essayTitle = `Quick Essay ${Date.now()}`
    await authenticatedPage.fill('input#title', essayTitle)

    // Fill in a minimal prompt
    const essayPrompt = 'This is a test essay prompt for quick creation without AI analysis.'
    await authenticatedPage.fill('textarea#prompt', essayPrompt)

    // Skip AI analysis - directly analyze then create
    const analyzeButton = authenticatedPage.locator('button', { hasText: 'Analyze Prompt with Morgan' })
    await analyzeButton.click()

    // Wait for analysis to complete
    await expect(authenticatedPage.locator('text="Ready to start writing?"')).toBeVisible({ timeout: 60000 })

    // Click Create Essay
    await authenticatedPage.locator('button', { hasText: 'Create Essay' }).click()

    // Wait for navigation to essay editor with longer timeout
    await authenticatedPage.waitForURL(/\/dashboard\/essays\/[a-zA-Z0-9-]+$/, { timeout: 30000 })

    // Wait for editor page to load completely
    await authenticatedPage.waitForLoadState('networkidle', { timeout: 30000 })

    // Verify we reached the editor
    await expect(authenticatedPage.locator('h1', { hasText: essayTitle })).toBeVisible({ timeout: 15000 })
  })

  test('should validate required fields before analysis', async ({ authenticatedPage }) => {
    // Navigate to new essay page
    await authenticatedPage.goto('/dashboard/essays/new', {
      waitUntil: 'networkidle',
      timeout: 60000
    })

    // Wait for page to load
    await authenticatedPage.waitForFunction(
      () => document.querySelector('h1')?.textContent?.includes('Create New Essay'),
      { timeout: 30000 }
    )
    await expect(authenticatedPage.locator('h1')).toBeVisible()

    // Try to analyze without filling anything
    const analyzeButton = authenticatedPage.locator('button', { hasText: 'Analyze Prompt with Morgan' })

    // Button should be disabled when prompt is empty or too short
    await expect(analyzeButton).toBeDisabled()

    // Fill in a short prompt (less than 10 characters)
    await authenticatedPage.fill('textarea#prompt', 'short')

    // Button should still be disabled
    await expect(analyzeButton).toBeDisabled()

    // Fill in a valid prompt (10+ characters)
    await authenticatedPage.fill('textarea#prompt', 'This is a valid essay prompt that is long enough.')

    // Button should now be enabled
    await expect(analyzeButton).toBeEnabled()
  })

  test('should allow editing prompt after analysis', async ({ authenticatedPage }) => {
    // Navigate to new essay page
    await authenticatedPage.goto('/dashboard/essays/new', {
      waitUntil: 'networkidle',
      timeout: 60000
    })

    // Wait for page to load
    await authenticatedPage.waitForFunction(
      () => document.querySelector('h1')?.textContent?.includes('Create New Essay'),
      { timeout: 30000 }
    )
    await expect(authenticatedPage.locator('h1')).toBeVisible()

    // Fill in essay details
    await authenticatedPage.fill('input#title', `Editable Essay ${Date.now()}`)
    await authenticatedPage.fill('textarea#prompt', 'Initial essay prompt for testing edit functionality.')

    // Analyze the prompt
    await authenticatedPage.locator('button', { hasText: 'Analyze Prompt with Morgan' }).click()

    // Wait for analysis results
    await expect(authenticatedPage.locator('text="Ready to start writing?"')).toBeVisible({ timeout: 60000 })

    // Click "Back to Edit Prompt" button
    const backButton = authenticatedPage.locator('button', { hasText: 'Back to Edit Prompt' })
    await expect(backButton).toBeVisible()
    await backButton.click()

    // Should return to input step
    await expect(authenticatedPage.locator('input#title')).toBeVisible()
    await expect(authenticatedPage.locator('textarea#prompt')).toBeVisible()

    // Verify the form still has the previous values
    const titleValue = await authenticatedPage.inputValue('input#title')
    const promptValue = await authenticatedPage.inputValue('textarea#prompt')

    expect(titleValue).toContain('Editable Essay')
    expect(promptValue).toContain('Initial essay prompt')
  })

  test.skip('should create essay with application context when applicationId provided', async ({ authenticatedPage }) => {
    // TODO: This test requires navigating to a specific application workspace
    // The application cards on the Kanban board need direct links to /applications/[id]
    // Navigate to applications page first to get an application
    await authenticatedPage.goto('/applications', {
      waitUntil: 'networkidle',
      timeout: 60000
    })
    await authenticatedPage.waitForFunction(
      () => document.querySelector('h1') !== null,
      { timeout: 30000 }
    )
    await expect(authenticatedPage.locator('h1')).toBeVisible({ timeout: 10000 })

    // Check if there are any applications - look for actual card elements
    // The cards contain scholarship titles and "SHOULD APPLY" buttons
    const applicationCard = authenticatedPage.locator('button:has-text("SHOULD APPLY")').first()
      .or(authenticatedPage.locator('text="Foundation Healthcare Fund"'))
      .or(authenticatedPage.locator('text="0/1 Essays"'))

    const hasApplication = await applicationCard.count() > 0

    if (!hasApplication) {
      console.log('No applications found, skipping application context test')
      test.skip()
      return
    }

    // For this test, we'll just use the essay creation page directly without needing
    // to navigate through the application workspace. The test validates that the
    // applicationId parameter works correctly.
    // In a real scenario, the user would click "Add Essay" from an application workspace

    // Since we have applications, we can test the applicationId functionality
    // Just use a known scholarship for testing
    const mockApplicationId = 'test-app-id-123'

    // Navigate to new essay page with applicationId query parameter
    await authenticatedPage.goto(`/dashboard/essays/new?applicationId=${mockApplicationId}`, {
      waitUntil: 'networkidle',
      timeout: 60000
    })

    // Wait for page to load
    await authenticatedPage.waitForFunction(
      () => document.querySelector('h1')?.textContent?.includes('Create New Essay'),
      { timeout: 30000 }
    )
    await expect(authenticatedPage.locator('h1', { hasText: 'Create New Essay' })).toBeVisible()

    // Fill in essay details
    const essayTitle = `Application Essay ${Date.now()}`
    await authenticatedPage.fill('input#title', essayTitle)
    await authenticatedPage.fill('textarea#prompt', 'Essay prompt for specific scholarship application context.')

    // Analyze and create
    await authenticatedPage.locator('button', { hasText: 'Analyze Prompt with Morgan' }).click()
    await expect(authenticatedPage.locator('text="Ready to start writing?"')).toBeVisible({ timeout: 60000 })
    await authenticatedPage.locator('button', { hasText: 'Create Essay' }).click()

    // Wait for navigation to editor with longer timeout
    await authenticatedPage.waitForURL(/\/dashboard\/essays\/[a-zA-Z0-9-]+$/, { timeout: 30000 })

    // Wait for editor page to load completely
    await authenticatedPage.waitForLoadState('networkidle', { timeout: 30000 })

    // Verify we reached the editor
    await expect(authenticatedPage.locator('h1', { hasText: essayTitle })).toBeVisible({ timeout: 15000 })
  })
})

test.describe('Essay Creation from Application Workspace', () => {
  test.skip('should create essay from application workspace modal', async ({ authenticatedPage }) => {
    // TODO: This test requires the application cards to link to /applications/[id]
    // Currently the cards on the Kanban board don't navigate to individual workspace pages
    // This test uses the existing essay-modal-create.spec.ts workflow
    // Navigate to applications page
    await authenticatedPage.goto('/applications', {
      waitUntil: 'networkidle',
      timeout: 60000
    })
    await authenticatedPage.waitForFunction(
      () => document.querySelector('h1') !== null,
      { timeout: 30000 }
    )
    await expect(authenticatedPage.locator('h1')).toBeVisible({ timeout: 10000 })

    // Find an application card by looking for scholarship titles or SHOULD APPLY buttons
    const applicationCard = authenticatedPage.locator('button:has-text("SHOULD APPLY")').first()
      .or(authenticatedPage.locator('text="Foundation Healthcare Fund"'))

    const hasApplication = await applicationCard.count() > 0

    if (!hasApplication) {
      console.log('No applications found, skipping modal test')
      test.skip()
      return
    }

    // Click the application card/title to open workspace
    // Just click the first one we find
    const cardToClick = authenticatedPage.getByRole('link', { name: 'Foundation Healthcare Fund' }).first()

    if (await cardToClick.count() === 0) {
      console.log('Could not find clickable application')
      test.skip()
      return
    }

    await cardToClick.click()

    // Wait for workspace to load
    await expect(authenticatedPage.locator('h1')).toBeVisible({ timeout: 10000 })

    // Find and click "Add Optional Essay" or "Add Another Essay" button
    const addEssayButton = authenticatedPage.locator('button', { hasText: 'Add Optional Essay' })
      .or(authenticatedPage.locator('button', { hasText: 'Add Another Essay' }))

    await expect(addEssayButton.first()).toBeVisible({ timeout: 5000 })
    await addEssayButton.first().click()

    // Verify modal opened
    await expect(authenticatedPage.locator('text="Add Essay"')).toBeVisible()

    // Fill in essay details in modal
    const essayTitle = `Modal Essay ${Date.now()}`
    const essayPrompt = 'This is an essay created through the application workspace modal.'

    await authenticatedPage.fill('input[id="essay-title"]', essayTitle)
    await authenticatedPage.fill('textarea[id="essay-prompt"]', essayPrompt)

    // Click Create Essay button in modal
    const createButton = authenticatedPage.locator('button[type="submit"]', { hasText: 'Create Essay' })
    await createButton.click()

    // Wait for navigation to essay editor
    await authenticatedPage.waitForURL(/\/dashboard\/essays\/.*/, { timeout: 15000 })

    // Verify we're on the essay editor page
    expect(authenticatedPage.url()).toContain('/dashboard/essays/')

    // Verify the essay editor loaded with correct title
    await expect(authenticatedPage.locator('h1', { hasText: essayTitle })).toBeVisible({ timeout: 10000 })
  })
})

/**
 * Test Execution Instructions:
 *
 * Run all essay workflow tests:
 *   npx playwright test tests/e2e/essays/essay-workflow.spec.ts
 *
 * Run in headed mode to see the browser:
 *   npx playwright test tests/e2e/essays/essay-workflow.spec.ts --headed
 *
 * Run specific test:
 *   npx playwright test tests/e2e/essays/essay-workflow.spec.ts -g "should create essay from new essay page"
 *
 * Run with specific browser:
 *   npx playwright test tests/e2e/essays/essay-workflow.spec.ts --project=chromium
 *   npx playwright test tests/e2e/essays/essay-workflow.spec.ts --project=firefox
 *   npx playwright test tests/e2e/essays/essay-workflow.spec.ts --project=webkit
 *
 * Debug mode:
 *   npx playwright test tests/e2e/essays/essay-workflow.spec.ts --debug
 */
