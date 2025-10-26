# Scholarship Hunter - Test Suite Documentation

**Production-Ready Testing Framework** for the Scholarship Hunter application.

---

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)
- [Running Tests](#running-tests)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

---

## Overview

This test suite provides comprehensive E2E and unit testing for the Scholarship Hunter application using:

- **Playwright** - E2E browser testing
- **Vitest** - Unit/integration testing
- **Custom Fixtures** - Auto-cleanup data factories
- **TypeScript** - Type-safe test development

### Key Features

✅ **Auto-Cleanup** - All test data cleaned up automatically
✅ **Data Factories** - Realistic test data with Faker.js
✅ **Auth Helpers** - Bypass UI login for faster tests
✅ **API Utilities** - Direct tRPC/Prisma access
✅ **Fixture Architecture** - Composable test dependencies
✅ **Production Config** - Optimized timeouts, retries, artifacts

---

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Test Environment

```bash
# Copy test environment template
cp .env.test.example .env.test

# Edit .env.test with your test database credentials
# IMPORTANT: Use a SEPARATE test database!
```

### 3. Run Migrations

```bash
# Apply Prisma schema to test database
DATABASE_URL=<your_test_db_url> pnpm prisma db push
```

### 4. Run Tests

```bash
# Run E2E tests
pnpm test:e2e

# Run unit tests
pnpm test

# Run in UI mode (interactive)
pnpm test:e2e --ui

# Run specific test file
pnpm test:e2e tests/e2e/auth/login.spec.ts
```

---

## Architecture

### Directory Structure

```
tests/
├── e2e/                          # E2E test files
│   ├── auth/                     # Authentication tests
│   ├── scholarships/             # Scholarship feature tests
│   ├── profile/                  # Profile management tests
│   └── dashboard/                # Dashboard tests
│
├── support/                      # Framework infrastructure ⭐
│   ├── fixtures/
│   │   ├── index.ts             # Custom test fixtures
│   │   └── factories/           # Data factories
│   │       ├── user-factory.ts
│   │       ├── scholarship-factory.ts
│   │       └── application-factory.ts
│   │
│   ├── helpers/
│   │   ├── auth-helpers.ts      # Authentication utilities
│   │   └── api-helpers.ts       # tRPC/Prisma helpers
│   │
│   ├── page-objects/            # Page object models (optional)
│   └── test-data/               # Static test data
│
├── unit/                         # Vitest unit tests
└── README.md                     # This file
```

### Fixture Architecture

The `support/` directory contains the **core testing infrastructure**:

#### **Fixtures** ([tests/support/fixtures/index.ts](tests/support/fixtures/index.ts))

Custom Playwright fixtures that extend the base `test` object:

```typescript
import { test, expect } from '../support/fixtures'

test('example', async ({ userFactory, authenticatedPage }) => {
  // Fixtures are auto-setup and auto-cleaned up
  const user = await userFactory.createUser()
  await authenticatedPage.goto('/dashboard')
})
```

**Available Fixtures:**

- `userFactory` - Create test users with auto-cleanup
- `scholarshipFactory` - Create test scholarships
- `applicationFactory` - Create test applications
- `authHelper` - Authentication utilities
- `apiHelper` - Direct API access
- `authenticatedPage` - Pre-authenticated page

#### **Data Factories**

Factories create realistic test data with automatic cleanup:

**UserFactory** ([tests/support/fixtures/factories/user-factory.ts](tests/support/fixtures/factories/user-factory.ts)):

```typescript
// Create basic user
const user = await userFactory.createUser()

// Create with profile
const userWithProfile = await userFactory.createUserWithProfile()

// Override defaults
const customUser = await userFactory.createUser({
  email: 'custom@test.com',
  firstName: 'John',
  lastName: 'Doe',
})

// Create admin
const admin = await userFactory.createAdmin()
```

**ScholarshipFactory** ([tests/support/fixtures/factories/scholarship-factory.ts](tests/support/fixtures/factories/scholarship-factory.ts)):

```typescript
// Create basic scholarship
const scholarship = await scholarshipFactory.createScholarship()

// Create merit-based scholarship
const meritScholarship = await scholarshipFactory.createMeritScholarship()

// Create STEM scholarship
const stemScholarship = await scholarshipFactory.createSTEMScholarship({
  awardAmount: 10000,
  deadline: new Date('2025-12-31'),
})

// Create multiple
const scholarships = await scholarshipFactory.createMany(10)
```

**ApplicationFactory** ([tests/support/fixtures/factories/application-factory.ts](tests/support/fixtures/factories/application-factory.ts)):

```typescript
// Create draft application
const app = await applicationFactory.createDraftApplication(studentId, scholarshipId)

// Create in-progress application
const inProgress = await applicationFactory.createInProgressApplication(studentId, scholarshipId)

// Create awarded application
const awarded = await applicationFactory.createAwardedApplication(studentId, scholarshipId, 5000)
```

---

## Writing Tests

### Basic E2E Test

```typescript
import { test, expect } from '../support/fixtures'

test.describe('Scholarship Search', () => {
  test('should display search results', async ({ page, scholarshipFactory }) => {
    // Create test data
    await scholarshipFactory.createSTEMScholarship({
      name: 'Computer Science Excellence Award',
      awardAmount: 5000,
    })

    // Navigate and test
    await page.goto('/scholarships')
    await page.fill('[data-testid="search-input"]', 'Computer Science')
    await page.click('[data-testid="search-button"]')

    // Assert results
    await expect(page.locator('[data-testid="scholarship-card"]')).toBeVisible()
    await expect(page.locator('text=Computer Science Excellence Award')).toBeVisible()
  })
})
```

### Authenticated Test

```typescript
import { test, expect } from '../support/fixtures'

test.describe('Dashboard', () => {
  test('should show user profile', async ({ authenticatedPage, userFactory }) => {
    // authenticatedPage is already logged in!
    const user = await userFactory.createUserWithProfile()

    await authenticatedPage.goto('/dashboard')

    // Assert user-specific content
    await expect(authenticatedPage.locator('[data-testid="user-name"]')).toHaveText(
      `${user.student.firstName} ${user.student.lastName}`
    )
  })
})
```

### API-First Test Setup

```typescript
import { test, expect } from '../support/fixtures'

test.describe('Application Management', () => {
  test('should track application progress', async ({ page, userFactory, scholarshipFactory, applicationFactory, authHelper }) => {
    // Create test data via API (faster than UI)
    const user = await userFactory.createUserWithProfile()
    const scholarship = await scholarshipFactory.createScholarship()
    const application = await applicationFactory.createInProgressApplication(user.student!.id, scholarship.id)

    // Set auth state (bypass login UI)
    await authHelper.setAuthState(user)

    // Test UI
    await page.goto(`/applications/${application.id}`)
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible()
  })
})
```

---

## Best Practices

### 1. **Use Data-TestID Selectors**

❌ **Bad (Brittle)**:

```typescript
await page.click('text=Sign In') // Breaks when copy changes
await page.locator('.btn-primary').click() // Breaks when CSS changes
```

✅ **Good (Stable)**:

```typescript
await page.click('[data-testid="login-button"]')
await page.fill('[data-testid="email-input"]', email)
```

**Add to your components**:

```tsx
<button data-testid="login-button">Sign In</button>
<input data-testid="email-input" type="email" />
```

### 2. **Avoid Hard-Coded Waits**

❌ **Bad (Flaky)**:

```typescript
await page.waitForTimeout(3000) // Race condition!
```

✅ **Good (Deterministic)**:

```typescript
await page.waitForSelector('[data-testid="results"]')
await expect(page.locator('[data-testid="results"]')).toBeVisible()
```

### 3. **Test Isolation**

Each test should be **independent** and **idempotent**:

✅ **Good**:

```typescript
test('test 1', async ({ userFactory }) => {
  const user = await userFactory.createUser() // Creates isolated data
  // Test...
  // Auto-cleanup on test end
})

test('test 2', async ({ userFactory }) => {
  const user = await userFactory.createUser() // Fresh data, no pollution
  // Test...
})
```

❌ **Bad**:

```typescript
// Shared state across tests (AVOID!)
let sharedUser

test('test 1', async () => {
  sharedUser = await createUser() // Pollutes other tests
})

test('test 2', async () => {
  // Depends on test 1 running first (brittle!)
  await updateUser(sharedUser)
})
```

### 4. **Prefer API Setup Over UI**

For test **setup**, use API helpers (faster):

```typescript
test('scholarship details page', async ({ page, scholarshipFactory }) => {
  // ✅ Create via API (fast)
  const scholarship = await scholarshipFactory.createScholarship()

  // Then test UI
  await page.goto(`/scholarships/${scholarship.id}`)
  await expect(page.locator('h1')).toHaveText(scholarship.name)
})
```

Only use UI when **testing the UI flow itself**:

```typescript
test('create scholarship via form', async ({ page }) => {
  // ✅ Test the UI workflow
  await page.goto('/admin/scholarships/new')
  await page.fill('[data-testid="name-input"]', 'New Scholarship')
  await page.click('[data-testid="submit-button"]')
  await expect(page.locator('text=Created successfully')).toBeVisible()
})
```

### 5. **Test User Flows, Not Implementation**

✅ **Good (User-Centric)**:

```typescript
test('user can apply to scholarship', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/scholarships/123')
  await authenticatedPage.click('[data-testid="apply-button"]')
  await expect(authenticatedPage.locator('text=Application started')).toBeVisible()
})
```

❌ **Bad (Implementation-Focused)**:

```typescript
test('clicking button calls createApplication mutation', async ({ page }) => {
  // Don't test implementation details
})
```

---

## Running Tests

### Local Development

```bash
# Run all E2E tests
pnpm test:e2e

# Run in headed mode (see browser)
pnpm test:e2e --headed

# Run in UI mode (interactive, recommended for debugging)
pnpm test:e2e --ui

# Run specific test file
pnpm test:e2e tests/e2e/auth/login.spec.ts

# Run tests matching a pattern
pnpm test:e2e --grep "login"

# Debug mode (step through tests)
pnpm test:e2e --debug

# Run with trace (generates detailed trace files)
pnpm test:e2e --trace on
```

### Unit Tests

```bash
# Run unit tests
pnpm test

# Run in watch mode
pnpm test --watch

# Run with coverage
pnpm test --coverage
```

### View Reports

```bash
# Open HTML report (after test run)
pnpm playwright show-report test-results/html

# View trace (after failure)
pnpm playwright show-trace test-results/artifacts/trace.zip
```

---

## CI/CD Integration

### GitHub Actions

The test suite is optimized for CI environments:

```yaml
# .github/workflows/test.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm playwright install --with-deps

      - run: pnpm test:e2e
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          CLERK_SECRET_KEY: ${{ secrets.CLERK_TEST_SECRET }}

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: test-results
          path: test-results/
```

### CI Optimizations

The config automatically applies CI-specific settings:

- **Retries**: 2 automatic retries on failure
- **Workers**: Single worker for stability
- **Artifacts**: Failure-only screenshots/videos/traces
- **Reporter**: JUnit XML for CI integration

---

## Troubleshooting

### Tests Failing Locally

**1. Database Issues**

```bash
# Reset test database
DATABASE_URL=<test_db> pnpm prisma db push --force-reset

# Check connection
DATABASE_URL=<test_db> pnpm prisma studio
```

**2. Clerk Authentication**

- Ensure `.env.test` has valid Clerk test keys
- Check that test users exist in Clerk dashboard
- Verify Clerk redirects are configured correctly

**3. Port Conflicts**

```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Tests Flaky

**Symptoms**: Tests pass sometimes, fail other times

**Solutions**:

1. **Remove hard-coded waits**: Use `waitForSelector` instead of `waitForTimeout`
2. **Check test isolation**: Ensure tests don't share state
3. **Increase timeouts**: Adjust in [playwright.config.ts](../playwright.config.ts)
4. **Run with trace**: `pnpm test:e2e --trace on` to debug

### Slow Tests

**Optimize by**:

1. **Use authenticatedPage fixture**: Bypasses UI login
2. **Create data via API**: Use factories instead of UI workflows
3. **Run tests in parallel**: Remove `test.describe.serial()`
4. **Reduce browser count**: Comment out Firefox/WebKit in config

---

## Configuration Files

- [playwright.config.ts](../playwright.config.ts) - Playwright configuration
- [.env.test.example](.env.test.example) - Test environment template
- [vitest.config.ts](../vitest.config.ts) - Vitest configuration (if exists)

---

## Contributing

### Adding New Tests

1. Create test file in appropriate directory (e.g., `tests/e2e/scholarships/`)
2. Import custom fixtures: `import { test, expect } from '../support/fixtures'`
3. Use data factories for test data
4. Use `data-testid` selectors
5. Ensure test isolation (no shared state)

### Adding New Factories

1. Create factory in `tests/support/fixtures/factories/`
2. Extend base factory pattern (see existing factories)
3. Add to fixture index: `tests/support/fixtures/index.ts`
4. Implement `cleanup()` method for auto-cleanup

---

## Resources

- [Playwright Docs](https://playwright.dev)
- [Vitest Docs](https://vitest.dev)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [Prisma Testing](https://www.prisma.io/docs/guides/testing)

---

**Questions?** Open an issue or contact the team.

**Happy Testing!** 🧪
