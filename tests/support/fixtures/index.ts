/**
 * Custom Playwright Test Fixtures
 *
 * This file extends Playwright's base test object with custom fixtures
 * that provide auto-cleanup, data factories, and helper utilities.
 *
 * Usage:
 *   import { test, expect } from '../support/fixtures'
 *
 * Benefits:
 *   - Automatic cleanup of test data
 *   - Isolated test execution
 *   - Reusable factories and helpers
 *   - Type-safe fixture composition
 */

import { test as base, expect } from '@playwright/test'
import { UserFactory } from './factories/user-factory'
import { ScholarshipFactory } from './factories/scholarship-factory'
import { ApplicationFactory } from './factories/application-factory'
import { AuthHelper } from '../helpers/auth-helpers'
import { ApiHelper } from '../helpers/api-helpers'

// Define custom fixture types
type TestFixtures = {
  userFactory: UserFactory
  scholarshipFactory: ScholarshipFactory
  applicationFactory: ApplicationFactory
  authHelper: AuthHelper
  apiHelper: ApiHelper
  authenticatedPage: typeof base.prototype.page
}

/**
 * Extended test object with custom fixtures
 *
 * Each fixture is automatically set up before the test and torn down after.
 * Factories track created resources and clean them up automatically.
 */
export const test = base.extend<TestFixtures>({
  // User factory with auto-cleanup
  userFactory: async ({}, use) => {
    const factory = new UserFactory()
    await use(factory)
    await factory.cleanup()
  },

  // Scholarship factory with auto-cleanup
  scholarshipFactory: async ({}, use) => {
    const factory = new ScholarshipFactory()
    await use(factory)
    await factory.cleanup()
  },

  // Application factory with auto-cleanup
  applicationFactory: async ({}, use) => {
    const factory = new ApplicationFactory()
    await use(factory)
    await factory.cleanup()
  },

  // Authentication helper
  authHelper: async ({ page }, use) => {
    const helper = new AuthHelper(page)
    await use(helper)
  },

  // API helper for tRPC calls
  apiHelper: async ({}, use) => {
    const helper = new ApiHelper()
    await use(helper)
  },

  // Pre-authenticated page fixture
  // Creates a test user and returns a page with active session
  authenticatedPage: async ({ page, userFactory, authHelper }, use) => {
    const user = await userFactory.createUser()
    await authHelper.setAuthState(user)
    await use(page)
  },
})

// Re-export expect for convenience
export { expect }
