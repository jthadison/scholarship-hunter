# Testing Framework Migration Guide

**Upgrading from Basic Playwright to Production-Ready Testing Framework**

---

## Overview

This guide helps you migrate existing tests to use the new production-ready testing patterns with fixtures, factories, and helpers.

---

## What's New

### Before (Old Pattern)
```typescript
import { test, expect } from '@playwright/test'

test('user login', async ({ page }) => {
  await page.goto('/sign-in')
  await page.waitForSelector('[data-clerk-component]')
  await page.fill('input[name="identifier"]', 'test@example.com')
  await page.click('button:has-text("Continue")')
  // ... manual login flow
})
```

### After (New Pattern)
```typescript
import { test, expect } from '../support/fixtures'

test('user login', async ({ authenticatedPage, userFactory }) => {
  // User created with auto-cleanup
  const user = await userFactory.createUserWithProfile()

  // Already authenticated - no UI login needed!
  await authenticatedPage.goto('/dashboard')

  // Test actual functionality
  await expect(authenticatedPage.locator('[data-testid="user-name"]'))
    .toHaveText(`${user.student.firstName} ${user.student.lastName}`)
})
```

---

## Step-by-Step Migration

### Step 1: Update Imports

**Old:**
```typescript
import { test, expect } from '@playwright/test'
```

**New:**
```typescript
import { test, expect } from '../support/fixtures'
```

### Step 2: Replace Manual Data Creation

**Old:**
```typescript
test('create scholarship', async ({ page }) => {
  // Manually create via UI
  await page.goto('/admin/scholarships/new')
  await page.fill('[name="name"]', 'Test Scholarship')
  await page.fill('[name="amount"]', '5000')
  await page.click('button[type="submit"]')
})
```

**New:**
```typescript
test('create scholarship', async ({ page, scholarshipFactory }) => {
  // Create via factory (faster, cleaner)
  const scholarship = await scholarshipFactory.createScholarship({
    name: 'Test Scholarship',
    awardAmount: 5000,
  })

  // Test the UI display
  await page.goto(`/scholarships/${scholarship.id}`)
  await expect(page.locator('h1')).toHaveText('Test Scholarship')
})
```

### Step 3: Replace Manual Authentication

**Old:**
```typescript
test('authenticated action', async ({ page }) => {
  // Manual login through UI
  await page.goto('/sign-in')
  await page.fill('input[name="identifier"]', 'test@example.com')
  await page.fill('input[name="password"]', 'password')
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard')

  // Now finally test the actual feature
  await page.goto('/settings')
})
```

**New:**
```typescript
test('authenticated action', async ({ authenticatedPage }) => {
  // Already authenticated! Skip directly to testing
  await authenticatedPage.goto('/settings')

  // Test the actual feature
})
```

### Step 4: Use API Helpers for Setup

**Old:**
```typescript
test('application status', async ({ page }) => {
  // Create application via UI (slow)
  await page.goto('/scholarships/123')
  await page.click('button:has-text("Apply")')
  await page.fill('[name="notes"]', 'Test notes')
  await page.click('button:has-text("Save")')

  // Then test status display
  await page.goto('/applications')
})
```

**New:**
```typescript
test('application status', async ({ authenticatedPage, userFactory, scholarshipFactory, applicationFactory }) => {
  // Create all data via API (fast)
  const user = await userFactory.createUserWithProfile()
  const scholarship = await scholarshipFactory.createScholarship()
  const application = await applicationFactory.createInProgressApplication(
    user.student.id,
    scholarship.id
  )

  // Test the UI display directly
  await authenticatedPage.goto('/applications')
  await expect(authenticatedPage.locator(`[data-testid="app-${application.id}"]`))
    .toBeVisible()
})
```

### Step 5: Replace Hard-Coded Waits

**Old:**
```typescript
await page.click('button')
await page.waitForTimeout(3000) // ❌ Flaky!
```

**New:**
```typescript
await page.click('button')
await page.waitForSelector('[data-testid="result"]') // ✅ Deterministic
await expect(page.locator('[data-testid="result"]')).toBeVisible()
```

### Step 6: Replace Brittle Selectors

**Old:**
```typescript
await page.click('text=Sign In') // Breaks when copy changes
await page.locator('.btn-primary').click() // Breaks when CSS changes
```

**New:**
```typescript
// Add to component:
<button data-testid="sign-in-button">Sign In</button>

// In test:
await page.click('[data-testid="sign-in-button"]') // ✅ Stable
```

---

## Common Patterns

### Pattern 1: Testing Search/Filter

**Old:**
```typescript
test('search scholarships', async ({ page }) => {
  await page.goto('/scholarships')
  await page.fill('input[type="search"]', 'STEM')
  await page.waitForTimeout(2000)

  // Hope results loaded...
  const results = await page.locator('.scholarship-card').count()
  expect(results).toBeGreaterThan(0)
})
```

**New:**
```typescript
test('search scholarships', async ({ page, scholarshipFactory }) => {
  // Create test scholarships with known data
  await scholarshipFactory.createSTEMScholarship({ name: 'STEM Award 1' })
  await scholarshipFactory.createSTEMScholarship({ name: 'STEM Award 2' })
  await scholarshipFactory.createScholarship({ name: 'Arts Award', category: 'Arts' })

  await page.goto('/scholarships')
  await page.fill('[data-testid="search-input"]', 'STEM')

  // Wait for specific result
  await page.waitForSelector('text=STEM Award 1')

  // Verify results
  await expect(page.locator('text=STEM Award 1')).toBeVisible()
  await expect(page.locator('text=STEM Award 2')).toBeVisible()
  await expect(page.locator('text=Arts Award')).not.toBeVisible()
})
```

### Pattern 2: Testing Forms

**Old:**
```typescript
test('update profile', async ({ page }) => {
  // Login manually...

  await page.goto('/settings')
  await page.fill('[name="gpa"]', '3.8')
  await page.click('button:has-text("Save")')
  await page.waitForTimeout(1000)

  // How do we verify it saved?
})
```

**New:**
```typescript
test('update profile', async ({ authenticatedPage, userFactory, apiHelper }) => {
  const user = await userFactory.createUserWithProfile()

  await authenticatedPage.goto('/settings')
  await authenticatedPage.fill('[data-testid="gpa-input"]', '3.8')
  await authenticatedPage.click('[data-testid="save-button"]')

  // Wait for success message
  await expect(authenticatedPage.locator('[data-testid="success-message"]'))
    .toBeVisible()

  // Verify via API
  const profile = await apiHelper.students.getByUserId(user.id)
  expect(profile?.profile?.gpa).toBe(3.8)
})
```

### Pattern 3: Testing Lists/Tables

**Old:**
```typescript
test('applications list', async ({ page }) => {
  await page.goto('/applications')
  const count = await page.locator('.application-row').count()
  expect(count).toBeGreaterThan(0) // Vague assertion
})
```

**New:**
```typescript
test('applications list', async ({ authenticatedPage, userFactory, scholarshipFactory, applicationFactory }) => {
  const user = await userFactory.createUserWithProfile()
  const scholarship1 = await scholarshipFactory.createScholarship({ name: 'Scholarship A' })
  const scholarship2 = await scholarshipFactory.createScholarship({ name: 'Scholarship B' })

  // Create specific applications
  await applicationFactory.createInProgressApplication(user.student.id, scholarship1.id)
  await applicationFactory.createSubmittedApplication(user.student.id, scholarship2.id)

  await authenticatedPage.goto('/applications')

  // Verify specific data is displayed
  await expect(authenticatedPage.locator('text=Scholarship A')).toBeVisible()
  await expect(authenticatedPage.locator('text=Scholarship B')).toBeVisible()
  await expect(authenticatedPage.locator('[data-testid="status-in-progress"]')).toHaveCount(1)
  await expect(authenticatedPage.locator('[data-testid="status-submitted"]')).toHaveCount(1)
})
```

---

## Migration Checklist

For each test file:

- [ ] Update import to use `../support/fixtures`
- [ ] Replace manual data creation with factories
- [ ] Use `authenticatedPage` instead of manual login
- [ ] Replace `waitForTimeout()` with `waitForSelector()`
- [ ] Use `data-testid` selectors (add to components first)
- [ ] Use API helpers for verification
- [ ] Remove test data cleanup code (auto-handled by fixtures)
- [ ] Ensure test isolation (no shared state)

---

## Adding data-testid Attributes

### Component Update Example

**Before:**
```tsx
export function LoginButton() {
  return <button onClick={handleLogin}>Sign In</button>
}
```

**After:**
```tsx
export function LoginButton() {
  return (
    <button
      data-testid="login-button"
      onClick={handleLogin}
    >
      Sign In
    </button>
  )
}
```

### Naming Convention

Use descriptive, hierarchical names:

```tsx
<div data-testid="scholarship-card">
  <h3 data-testid="scholarship-name">...</h3>
  <p data-testid="scholarship-amount">...</p>
  <button data-testid="scholarship-apply-button">Apply</button>
</div>
```

---

## Example Migration: login.spec.ts

### Original File

```typescript
// tests/e2e/auth/login.spec.ts
import { test, expect } from '@playwright/test'

test.describe('User Login Flow', () => {
  test('should display sign-in page', async ({ page }) => {
    await page.goto('/sign-in')
    await page.waitForSelector('[data-clerk-component]', { timeout: 10000 })
    await expect(page.locator('h1')).toContainText('Scholarship Hunter')
  })

  test('should redirect unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL('**/sign-in**', { timeout: 10000 })
    expect(page.url()).toContain('/sign-in')
  })
})
```

### Migrated File

```typescript
// tests/e2e/auth/login.spec.ts
import { test, expect } from '../../support/fixtures'

test.describe('User Login Flow', () => {
  test('should display sign-in page', async ({ page }) => {
    await page.goto('/sign-in')
    await page.waitForSelector('[data-clerk-component]')
    await expect(page.locator('[data-testid="app-title"]'))
      .toHaveText('Scholarship Hunter')
  })

  test('should redirect unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL('**/sign-in**')
    expect(page.url()).toContain('/sign-in')
  })

  test('should access dashboard when authenticated', async ({ authenticatedPage, userFactory }) => {
    const user = await userFactory.createUserWithProfile()

    await authenticatedPage.goto('/dashboard')
    await expect(authenticatedPage.locator('[data-testid="user-name"]'))
      .toBeVisible()
  })
})
```

---

## Benefits After Migration

✅ **10x faster** - Skip UI login, create data via API
✅ **More reliable** - No hard-coded waits, deterministic selectors
✅ **Easier to maintain** - DRY with factories, no manual cleanup
✅ **Better isolation** - Each test has its own data
✅ **Type-safe** - Full TypeScript support
✅ **Realistic data** - Faker generates real-looking test data

---

## Need Help?

See:
- [tests/README.md](../tests/README.md) - Full testing documentation
- [tests/e2e/examples/refactored-auth.spec.ts](../tests/e2e/examples/refactored-auth.spec.ts) - Example tests
- [tests/support/fixtures/](../tests/support/fixtures/) - Fixture implementations

---

Happy migrating! 🚀
