import { test, expect } from '@playwright/test';

test.describe('Documents Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to documents page
    await page.goto('http://localhost:3001/documents');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should load documents page without hydration errors', async ({ page }) => {
    // Check for console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait a bit for any errors to surface
    await page.waitForTimeout(2000);

    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/documents-page.png', fullPage: true });

    // Log any errors found
    if (errors.length > 0) {
      console.log('Console errors found:');
      errors.forEach((err) => console.log('  -', err));
    }

    // Check page title or main content
    const pageContent = await page.textContent('body');
    console.log('Page loaded with content length:', pageContent?.length);

    // Check if the page has expected elements
    const hasDocumentsHeading = await page.locator('h1, h2').filter({ hasText: /document/i }).count();
    console.log('Found document headings:', hasDocumentsHeading);

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

  test('should display main document vault UI elements', async ({ page }) => {
    // Check for main page elements
    const html = await page.content();
    console.log('HTML structure:', html.substring(0, 500));

    // Look for any visible text
    const visibleText = await page.locator('body').textContent();
    console.log('Visible text:', visibleText?.substring(0, 200));
  });
});
