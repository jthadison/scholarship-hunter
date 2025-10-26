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

export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Set authentication state without going through UI login
   *
   * This is the PREFERRED method for authenticated tests as it's much faster
   * than using the UI login flow.
   *
   * @param user - Test user to authenticate as
   */
  async setAuthState(user: TestUser): Promise<void> {
    // In a real implementation, you would:
    // 1. Generate a valid Clerk session token
    // 2. Set the session cookie
    // 3. Set localStorage/sessionStorage if needed

    // For now, we'll create a mock session token
    const mockSessionToken = this.generateMockSessionToken(user.clerkId)

    // Set Clerk session cookie
    await this.page.context().addCookies([
      {
        name: '__session',
        value: mockSessionToken,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ])

    // Set additional Clerk client state if needed
    await this.page.evaluate(
      ({ userId, email }) => {
        // Clerk stores some state in localStorage
        localStorage.setItem('__clerk_db_jwt', 'mock-jwt-token')
        localStorage.setItem(
          '__clerk_client',
          JSON.stringify({
            sessions: [
              {
                user: {
                  id: userId,
                  primaryEmailAddress: { emailAddress: email },
                },
              },
            ],
          })
        )
      },
      { userId: user.clerkId, email: user.email }
    )
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
    await this.page.goto('/sign-in')

    // Wait for Clerk component to load
    await this.page.waitForSelector('[data-clerk-component]', { timeout: 10000 })

    // Fill in credentials
    const emailInput = this.page.locator('input[name="identifier"]')
    await emailInput.fill(email)

    // Clerk has a multi-step flow
    const continueButton = this.page.locator('button:has-text("Continue")')
    if (await continueButton.isVisible()) {
      await continueButton.click()
    }

    // Fill password
    const passwordInput = this.page.locator('input[name="password"]')
    await passwordInput.fill(password)

    // Submit
    const submitButton = this.page.locator('button[type="submit"]')
    await submitButton.click()

    // Wait for redirect to dashboard or home
    await this.page.waitForURL(/\/(dashboard|$)/, { timeout: 10000 })
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

  /**
   * Generate a mock session token for testing
   * In production, you would call Clerk's API to generate a real token
   */
  private generateMockSessionToken(clerkId: string): string {
    // This is a simplified mock token
    // In a real implementation, you would:
    // 1. Call Clerk's backend API to create a session
    // 2. Or use Clerk's testing tokens if available
    const payload = Buffer.from(JSON.stringify({ sub: clerkId, iat: Date.now() })).toString('base64')
    return `mock_session_${payload}`
  }

  /**
   * Create a Clerk session using backend API (production implementation)
   *
   * This would be used in a real test suite to create valid Clerk sessions
   * without going through the UI.
   */
  async createClerkSession(clerkId: string): Promise<string> {
    // TODO: Implement with Clerk Backend API
    // const clerkClient = new Clerk({ secretKey: process.env.CLERK_SECRET_KEY })
    // const session = await clerkClient.sessions.createSession({
    //   userId: clerkId,
    //   expiresInSeconds: 3600,
    // })
    // return session.id

    // For now, return mock
    return this.generateMockSessionToken(clerkId)
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
