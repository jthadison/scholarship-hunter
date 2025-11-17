import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright Configuration - Production-Ready Settings
 *
 * Key Features:
 * - Comprehensive timeout configuration (action: 15s, navigation: 30s, test: 60s)
 * - Multiple reporters (HTML, JUnit for CI, List for console)
 * - Failure-only artifacts (screenshots, videos, traces)
 * - Multi-browser support (Chromium, Firefox, WebKit)
 * - CI-optimized settings (retries, workers)
 *
 * See: tests/README.md for usage instructions
 */
export default defineConfig({
  // Global setup - runs once before all tests
  globalSetup: require.resolve('./tests/global-setup'),

  // Test directory
  testDir: './tests/e2e',

  // Parallel execution
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,

  // Retry failed tests in CI
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI for stability
  // Reduced from unlimited to 4 workers to prevent overwhelming dev server
  workers: process.env.CI ? 1 : 4,

  // Timeout settings (increased for server load and parallel execution)
  timeout: 120 * 1000, // Test timeout: 120s (increased from 60s)
  expect: {
    timeout: 30 * 1000, // Assertion timeout: 30s (increased from 15s)
  },

  // Multiple reporters for different purposes
  reporter: [
    ['html', { outputFolder: 'test-results/html', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }], // For CI integration
    ['list'], // Console output
    ...(process.env.CI ? [['github' as const] as const] : []), // GitHub Actions annotations
  ],

  // Shared settings for all projects
  use: {
    // Base URL for navigation
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Timeouts (increased for server load and parallel execution)
    actionTimeout: 30 * 1000, // Action timeout: 30s (increased from 15s)
    navigationTimeout: 60 * 1000, // Navigation timeout: 60s (increased from 30s)

    // Navigation wait strategy - 'domcontentloaded' is more reliable across browsers
    // than 'networkidle' which can be problematic with SSR, streaming, and keep-alive connections
    // Tests can override this on a per-navigation basis if needed

    // Failure artifacts (only on failure to save storage)
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',

    // Locale and timezone
    locale: 'en-US',
    timezoneId: 'America/New_York',

    // Viewport (desktop default)
    viewport: { width: 1280, height: 720 },

    // Ignore HTTPS errors in test environments
    ignoreHTTPSErrors: true,
  },

  // Browser projects
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile viewports (uncomment to enable)
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  // Local dev server
  // Automatically starts dev server if not running
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI, // Reuse in local dev, fresh start in CI
    timeout: 120 * 1000, // 2 minutes for server to start
    stdout: 'pipe', // Capture stdout for debugging
    stderr: 'pipe', // Capture stderr for debugging
  },

  // Output folder for test results
  outputDir: 'test-results/artifacts',
})
