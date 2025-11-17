/**
 * Authentication Helpers
 *
 * Manages test authentication state for Clerk-based auth.
 * Provides utilities to bypass UI login and set up authenticated sessions.
 *
 * Usage:
 *   await authHelper.setAuthState(user)
 *   await authHelper.loginViaUI(user.email, password)
 *
 * Features:
 *   - Bypass Clerk UI for faster tests
 *   - Mock authentication state
 *   - Session token management
 *   - Test-specific auth cookies
 */

import { Page } from '@playwright/test'
import type { TestUser } from '../fixtures/factories/user-factory'
import { clerk } from '@clerk/testing/playwright'

export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Set authentication state without going through UI login
   *
   * This is the PREFERRED method for authenticated tests as it's much faster
   * than using the UI login flow. Uses Clerk's official testing package.
   *
   * @param user - Test user to authenticate as
   */
  async setAuthState(user: TestUser): Promise<void> {
    try {
      // IMPORTANT: Clerk requires navigating to a non-protected page that loads Clerk BEFORE calling clerk.signIn()
      // We navigate to the homepage (public page) first to initialize Clerk
      await this.page.goto('/', {
        waitUntil: 'domcontentloaded',
        timeout: 60000 // Increased from 30000ms to match navigation timeout
      })

      // Wait for Clerk to be fully loaded on the page
      await clerk.loaded({ page: this.page })

      // Use Clerk's email-based sign-in (finds user by email, creates ticket automatically)
      // This requires TEST_USER_EMAIL to match an existing user in Clerk
      await clerk.signIn({
        page: this.page,
        emailAddress: user.email,
      })

      // CRITICAL: Wait for Clerk session to be fully established
      // After clerk.signIn(), we need to wait for the session cookies and client state to be set
      // This ensures subsequent navigations to protected routes work correctly
      await this.page.waitForFunction(
        () => {
          // Check if Clerk client is loaded and has an active session
          return window.Clerk?.client?.sessions?.length > 0
        },
        { timeout: 30000 } // Increased from 10000ms
      )

      // Verify __session cookie is set (this is what middleware checks)
      const cookies = await this.page.context().cookies()
      const sessionCookie = cookies.find(c => c.name === '__session')
      if (!sessionCookie) {
        throw new Error('Clerk __session cookie not found after sign-in')
      }

      // Navigate to a protected route to verify auth works
      // This ensures session persists across navigations
      await this.page.goto('/dashboard', {
        waitUntil: 'domcontentloaded',
        timeout: 60000 // Increased from 15000ms to match navigation timeout
      })

      // Verify we didn't get redirected to sign-in
      const url = this.page.url()
      if (url.includes('sign-in')) {
        throw new Error('Auth verification failed - redirected to sign-in')
      }

      console.log(`✅ Set auth state for user: ${user.email}`)
    } catch (error) {
      console.error('❌ Failed to set auth state:', error)
      console.log('⚠️  Falling back to UI-based login...')

      // Fallback to UI-based login if programmatic sign-in fails
      try {
        await this.loginViaUI(
          user.email,
          process.env.TEST_USER_PASSWORD || 'defaultPassword123!'
        )
        console.log(`✅ Set auth state for user (via UI fallback): ${user.email}`)
      } catch (uiError) {
        console.error('❌ UI login also failed:', uiError)
        throw new Error(`Failed to authenticate test user: ${error}`)
      }
    }
  }

  /**
   * Login via UI (slower, but tests the actual login flow)
   *
   * Use this when you specifically want to test the login flow.
   * For other tests, prefer setAuthState() for speed.
   *
   * @param email - User email
   * @param password - User password
   */
  async loginViaUI(email: string, password: string): Promise<void> {
    // Navigate to sign-in page with increased timeout and better wait strategy for cross-browser compatibility
    await this.page.goto('/sign-in', {
      waitUntil: 'domcontentloaded',
      timeout: 60000 // Increased from 30000ms
    })

    // Wait for Clerk sign-in form to load
    // Look for the email input field instead of data-clerk-component
    await this.page.waitForSelector('input[name="identifier"]', { timeout: 30000 }) // Increased from 15000ms

    // Fill in email
    const emailInput = this.page.locator('input[name="identifier"]')
    await emailInput.fill(email)

    // Click Continue button to proceed to password step (use more specific selector)
    const continueButton = this.page.locator('button[data-localization-key="formButtonPrimary"]')
    await continueButton.click()

    // Give Clerk a moment to validate the email and enable password field
    await this.page.waitForTimeout(500)

    // Wait for password field to appear AND be enabled (increased timeout for Clerk's async validation)
    await this.page.waitForSelector('input[name="password"]:not([disabled])', { timeout: 30000 }) // Increased from 15000ms

    // Fill password
    const passwordInput = this.page.locator('input[name="password"]')
    await passwordInput.fill(password)

    // Submit the form (use the same specific selector)
    const submitButton = this.page.locator('button[data-localization-key="formButtonPrimary"]')
    await submitButton.click()

    // Wait for redirect to dashboard or home
    await this.page.waitForURL(/\/(dashboard|$)/, { timeout: 30000 }) // Increased from 15000ms

    // Additional wait to ensure auth state is fully settled across all browsers
    // Firefox/WebKit need extra time for cookies/session to propagate
    await this.page.waitForTimeout(1000)

    // Verify auth cookie is set
    const cookies = await this.page.context().cookies()
    const hasAuthCookie = cookies.some((cookie) => cookie.name === '__session')
    if (!hasAuthCookie) {
      throw new Error('Authentication cookie not found after login')
    }
  }

  /**
   * Logout (clear auth state)
   */
  async logout(): Promise<void> {
    // Clear Clerk cookies and localStorage
    await this.page.context().clearCookies()
    await this.page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  }

  /**
   * Check if user is currently authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const cookies = await this.page.context().cookies()
    return cookies.some((cookie) => cookie.name === '__session')
  }

  /**
   * Wait for authentication to be established
   */
  async waitForAuth(timeout = 5000): Promise<void> {
    await this.page.waitForFunction(
      () => {
        return localStorage.getItem('__clerk_db_jwt') !== null
      },
      { timeout }
    )
  }

}

/**
 * Standalone helper to create authenticated context
 * Use this for setting up auth state outside of page context
 */
export async function createAuthenticatedContext(user: TestUser) {
  return {
    cookies: [
      {
        name: '__session',
        value: `mock_session_${user.clerkId}`,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax' as const,
      },
    ],
    localStorage: [
      {
        name: '__clerk_db_jwt',
        value: 'mock-jwt-token',
      },
      {
        name: '__clerk_client',
        value: JSON.stringify({
          sessions: [
            {
              user: {
                id: user.clerkId,
                primaryEmailAddress: { emailAddress: user.email },
              },
            },
          ],
        }),
      },
    ],
  }
}
