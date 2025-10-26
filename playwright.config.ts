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
  // Test directory
  testDir: './tests/e2e',

  // Parallel execution
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,

  // Retry failed tests in CI
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI for stability
  workers: process.env.CI ? 1 : undefined,

  // Timeout settings (production-ready values)
  timeout: 60 * 1000, // Test timeout: 60s
  expect: {
    timeout: 15 * 1000, // Assertion timeout: 15s
  },

  // Multiple reporters for different purposes
  reporter: [
    ['html', { outputFolder: 'test-results/html', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }], // For CI integration
    ['list'], // Console output
    ...(process.env.CI ? [['github' as const]] : []), // GitHub Actions annotations
  ],

  // Shared settings for all projects
  use: {
    // Base URL for navigation
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Timeouts
    actionTimeout: 15 * 1000, // Action timeout: 15s
    navigationTimeout: 30 * 1000, // Navigation timeout: 30s

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
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes for server to start
    stdout: 'ignore',
    stderr: 'pipe',
  },

  // Output folder for test results
  outputDir: 'test-results/artifacts',
})
