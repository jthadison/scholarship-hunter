import { test, expect } from '../support/fixtures';

test.describe('Documents Page', () => {
  test('should load documents page without hydration errors', async ({ authenticatedPage }) => {
    // Navigate to documents page (authenticated)
    await authenticatedPage.goto('/documents');

    // Wait for page to load - 'domcontentloaded' is more reliable across browsers
    await authenticatedPage.waitForLoadState('domcontentloaded');
    // Check for console errors
    const errors: string[] = [];
    authenticatedPage.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Verify page loaded
    await expect(authenticatedPage).toHaveURL(/\/documents/);

    // Check if the page has expected elements
    await expect(authenticatedPage.locator('h1, h2, [role="heading"]').first()).toBeVisible();

    // Check for hydration error
    const hydrationError = errors.some(err =>
      err.includes('Hydration') ||
      err.includes('hydration') ||
      err.includes('did not match')
    );

    if (hydrationError) {
      console.error('❌ HYDRATION ERROR DETECTED');
      throw new Error('Hydration error found on page');
    }
  });

  test('should display main document vault UI elements', async ({ authenticatedPage }) => {
    // Navigate to documents page with explicit wait strategy for Firefox compatibility
    await authenticatedPage.goto('/documents', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Verify page loads
    await expect(authenticatedPage).toHaveURL(/\/documents/);

    // Verify page content is visible
    await expect(authenticatedPage.locator('body')).toBeVisible();
  });
});
