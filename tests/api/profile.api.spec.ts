/**
 * API Tests: Profile tRPC Router
 * Story 1.4: Profile Data Model - Academic & Demographics
 *
 * Test Strategy:
 * - API tests validate business logic and data persistence
 * - Covers multiple scenarios (happy path, edge cases, validation errors)
 * - Uses data factories for test data
 * - Tests tRPC endpoints directly
 *
 * Coverage:
 * - AC4: Data validation ensures valid ranges and formats
 * - AC5: Profile data persisted to database
 * - Profile completeness calculation
 * - Partial profile updates
 */

import { test, expect } from '@playwright/test'
import { createProfileData } from '../support/factories/profile-factory'
import { ApiHelper } from '../support/helpers/api-helpers'

test.describe('Profile tRPC API - profile.create', () => {
  let apiHelper: ApiHelper

  test.beforeEach(() => {
    apiHelper = new ApiHelper()
  })

  test('should create profile with valid academic data', async () => {
    // GIVEN: Valid profile data with academic fields
    const profileData = createProfileData({
      gpa: 3.75,
      gpaScale: 4.0,
      satScore: 1450,
      actScore: 32,
      classRank: 15,
      classSize: 300,
      graduationYear: new Date().getFullYear() + 1,
      currentGrade: '12th',
    })

    // WHEN: Creating profile via tRPC endpoint
    const response = await apiHelper.trpc('profile.create', profileData)

    // THEN: Profile is created successfully
    expect(response.status).toBe(200)
    const profile = await response.json()

    expect(profile.result.data).toMatchObject({
      gpa: 3.75,
      gpaScale: 4.0,
      satScore: 1450,
      actScore: 32,
      classRank: 15,
      classSize: 300,
      graduationYear: new Date().getFullYear() + 1,
      currentGrade: '12th',
    })

    expect(profile.result.data.id).toBeDefined()
    expect(profile.result.data.completionPercentage).toBeGreaterThan(0)
  })

  test('should create profile with valid demographic data', async () => {
    // GIVEN: Valid profile data with demographic fields
    const profileData = createProfileData({
      gender: 'Female',
      ethnicity: ['Hispanic', 'White'],
      state: 'CA',
      city: 'Los Angeles',
      zipCode: '90001',
      citizenship: 'US Citizen',
    })

    // WHEN: Creating profile via tRPC endpoint
    const response = await apiHelper.trpc('profile.create', profileData)

    // THEN: Profile is created successfully
    expect(response.status).toBe(200)
    const profile = await response.json()

    expect(profile.result.data).toMatchObject({
      gender: 'Female',
      ethnicity: ['Hispanic', 'White'],
      state: 'CA',
      city: 'Los Angeles',
      zipCode: '90001',
      citizenship: 'US Citizen',
    })
  })

  test('should create profile with valid financial need data', async () => {
    // GIVEN: Valid profile data with financial fields
    const profileData = createProfileData({
      financialNeed: 'HIGH',
      pellGrantEligible: true,
      efcRange: '$0-$5,000',
    })

    // WHEN: Creating profile via tRPC endpoint
    const response = await apiHelper.trpc('profile.create', profileData)

    // THEN: Profile is created successfully
    expect(response.status).toBe(200)
    const profile = await response.json()

    expect(profile.result.data).toMatchObject({
      financialNeed: 'HIGH',
      pellGrantEligible: true,
      efcRange: '$0-$5,000',
    })
  })

  test('should calculate completionPercentage correctly for full profile', async () => {
    // GIVEN: Complete profile data with all fields
    const profileData = createProfileData({
      gpa: 3.8,
      satScore: 1500,
      graduationYear: new Date().getFullYear() + 1,
      gender: 'Male',
      state: 'TX',
      citizenship: 'US Citizen',
      financialNeed: 'MODERATE',
    })

    // WHEN: Creating profile
    const response = await apiHelper.trpc('profile.create', profileData)

    // THEN: Completion percentage is high
    const profile = await response.json()
    expect(profile.result.data.completionPercentage).toBeGreaterThanOrEqual(80)
  })

  test('should reject profile with invalid GPA (out of range)', async () => {
    // GIVEN: Profile data with invalid GPA (> 4.0)
    const profileData = createProfileData({
      gpa: 5.5, // Invalid: exceeds max
      gpaScale: 4.0,
    })

    // WHEN: Creating profile via tRPC endpoint
    const response = await apiHelper.trpc('profile.create', profileData)

    // THEN: Request fails with validation error
    expect(response.status).toBe(400)
    const error = await response.json()
    expect(error.error.message).toContain('GPA')
  })

  test('should reject profile with invalid SAT score', async () => {
    // GIVEN: Profile data with invalid SAT score
    const profileData = createProfileData({
      satScore: 2000, // Invalid: exceeds max (1600)
    })

    // WHEN: Creating profile via tRPC endpoint
    const response = await apiHelper.trpc('profile.create', profileData)

    // THEN: Request fails with validation error
    expect(response.status).toBe(400)
    const error = await response.json()
    expect(error.error.message).toContain('SAT')
  })

  test('should reject profile with invalid ACT score', async () => {
    // GIVEN: Profile data with invalid ACT score
    const profileData = createProfileData({
      actScore: 50, // Invalid: exceeds max (36)
    })

    // WHEN: Creating profile via tRPC endpoint
    const response = await apiHelper.trpc('profile.create', profileData)

    // THEN: Request fails with validation error
    expect(response.status).toBe(400)
    const error = await response.json()
    expect(error.error.message).toContain('ACT')
  })

  test('should reject profile with invalid zip code format', async () => {
    // GIVEN: Profile data with invalid zip code
    const profileData = createProfileData({
      zipCode: '1234', // Invalid: not 5 or 9 digits
    })

    // WHEN: Creating profile via tRPC endpoint
    const response = await apiHelper.trpc('profile.create', profileData)

    // THEN: Request fails with validation error
    expect(response.status).toBe(400)
    const error = await response.json()
    expect(error.error.message).toContain('zip')
  })

  test('should accept valid zip code formats (5 and 9 digits)', async () => {
    // GIVEN: Profile data with 5-digit zip code
    const profileData1 = createProfileData({ zipCode: '90210' })

    // WHEN: Creating profile
    const response1 = await apiHelper.trpc('profile.create', profileData1)

    // THEN: Request succeeds
    expect(response1.status).toBe(200)

    // GIVEN: Profile data with 9-digit zip code
    const profileData2 = createProfileData({ zipCode: '90210-1234' })

    // WHEN: Creating profile
    const response2 = await apiHelper.trpc('profile.create', profileData2)

    // THEN: Request succeeds
    expect(response2.status).toBe(200)
  })
})

test.describe('Profile tRPC API - profile.update', () => {
  let apiHelper: ApiHelper

  test.beforeEach(() => {
    apiHelper = new ApiHelper()
  })

  test('should update existing profile with partial data', async () => {
    // GIVEN: Existing profile
    const initialProfile = createProfileData({ gpa: 3.5, satScore: 1200 })
    const createResponse = await apiHelper.trpc('profile.create', initialProfile)
    const created = await createResponse.json()
    const profileId = created.result.data.id

    // WHEN: Updating only GPA field
    const updateData = { gpa: 3.8 }
    const response = await apiHelper.trpc('profile.update', {
      id: profileId,
      ...updateData,
    })

    // THEN: Profile is updated with new GPA, other fields unchanged
    expect(response.status).toBe(200)
    const updated = await response.json()
    expect(updated.result.data.gpa).toBe(3.8)
    expect(updated.result.data.satScore).toBe(1200) // Unchanged
  })

  test('should recalculate completionPercentage after update', async () => {
    // GIVEN: Existing profile with 50% completion
    const initialProfile = createProfileData({ gpa: 3.0 }) // Minimal data
    const createResponse = await apiHelper.trpc('profile.create', initialProfile)
    const created = await createResponse.json()
    const profileId = created.result.data.id
    const initialCompletion = created.result.data.completionPercentage

    // WHEN: Adding more fields to increase completion
    const updateData = {
      satScore: 1300,
      graduationYear: new Date().getFullYear() + 1,
      state: 'NY',
      citizenship: 'US Citizen',
      financialNeed: 'MODERATE',
    }
    const response = await apiHelper.trpc('profile.update', {
      id: profileId,
      ...updateData,
    })

    // THEN: Completion percentage increases
    const updated = await response.json()
    expect(updated.result.data.completionPercentage).toBeGreaterThan(initialCompletion)
  })

  test('should reject update with invalid data', async () => {
    // GIVEN: Existing profile
    const initialProfile = createProfileData({ gpa: 3.5 })
    const createResponse = await apiHelper.trpc('profile.create', initialProfile)
    const created = await createResponse.json()
    const profileId = created.result.data.id

    // WHEN: Updating with invalid GPA
    const response = await apiHelper.trpc('profile.update', {
      id: profileId,
      gpa: 6.0, // Invalid
    })

    // THEN: Request fails with validation error
    expect(response.status).toBe(400)
    const error = await response.json()
    expect(error.error.message).toContain('GPA')
  })
})

test.describe('Profile tRPC API - profile.get', () => {
  let apiHelper: ApiHelper

  test.beforeEach(() => {
    apiHelper = new ApiHelper()
  })

  test('should retrieve existing profile by student ID', async () => {
    // GIVEN: Created profile
    const profileData = createProfileData({
      gpa: 3.6,
      satScore: 1350,
      state: 'FL',
    })
    const createResponse = await apiHelper.trpc('profile.create', profileData)
    const created = await createResponse.json()
    const profileId = created.result.data.id

    // WHEN: Fetching profile by ID
    const response = await apiHelper.trpc('profile.get', { id: profileId })

    // THEN: Profile is returned with all fields
    expect(response.status).toBe(200)
    const profile = await response.json()
    expect(profile.result.data).toMatchObject({
      id: profileId,
      gpa: 3.6,
      satScore: 1350,
      state: 'FL',
    })
  })

  test('should return null for non-existent profile', async () => {
    // GIVEN: Non-existent profile ID
    const fakeId = 'non-existent-id'

    // WHEN: Fetching profile
    const response = await apiHelper.trpc('profile.get', { id: fakeId })

    // THEN: Response indicates profile not found
    expect(response.status).toBe(404)
  })

  test('should return profile with calculated metadata', async () => {
    // GIVEN: Created profile
    const profileData = createProfileData({
      gpa: 3.9,
      satScore: 1550,
      actScore: 35,
      graduationYear: new Date().getFullYear() + 1,
      state: 'CA',
      citizenship: 'US Citizen',
      financialNeed: 'LOW',
    })
    const createResponse = await apiHelper.trpc('profile.create', profileData)
    const created = await createResponse.json()
    const profileId = created.result.data.id

    // WHEN: Fetching profile
    const response = await apiHelper.trpc('profile.get', { id: profileId })

    // THEN: Profile includes calculated fields
    const profile = await response.json()
    expect(profile.result.data.completionPercentage).toBeDefined()
    expect(profile.result.data.completionPercentage).toBeGreaterThan(0)
    expect(profile.result.data.strengthScore).toBeDefined()
  })
})

test.describe('Profile Validation - Edge Cases', () => {
  let apiHelper: ApiHelper

  test.beforeEach(() => {
    apiHelper = new ApiHelper()
  })

  test('should accept profile with no test scores (optional fields)', async () => {
    // GIVEN: Profile data without SAT/ACT scores
    const profileData = createProfileData({
      gpa: 3.5,
      satScore: null,
      actScore: null,
    })

    // WHEN: Creating profile
    const response = await apiHelper.trpc('profile.create', profileData)

    // THEN: Profile is created successfully
    expect(response.status).toBe(200)
    const profile = await response.json()
    expect(profile.result.data.satScore).toBeNull()
    expect(profile.result.data.actScore).toBeNull()
  })

  test('should accept profile with multiple ethnicities', async () => {
    // GIVEN: Profile data with multiple ethnicity selections
    const profileData = createProfileData({
      ethnicity: ['Asian', 'Hispanic', 'Native American'],
    })

    // WHEN: Creating profile
    const response = await apiHelper.trpc('profile.create', profileData)

    // THEN: Profile is created with all ethnicities
    expect(response.status).toBe(200)
    const profile = await response.json()
    expect(profile.result.data.ethnicity).toHaveLength(3)
    expect(profile.result.data.ethnicity).toContain('Asian')
    expect(profile.result.data.ethnicity).toContain('Hispanic')
    expect(profile.result.data.ethnicity).toContain('Native American')
  })

  test('should validate class rank is less than class size', async () => {
    // GIVEN: Profile with class rank > class size (invalid)
    const profileData = createProfileData({
      classRank: 350,
      classSize: 300,
    })

    // WHEN: Creating profile
    const response = await apiHelper.trpc('profile.create', profileData)

    // THEN: Request fails with validation error
    expect(response.status).toBe(400)
    const error = await response.json()
    expect(error.error.message).toContain('class rank')
  })

  test('should accept valid financial need enum values', async () => {
    // Test all valid enum values
    const validValues = ['LOW', 'MODERATE', 'HIGH', 'VERY_HIGH']

    for (const value of validValues) {
      // GIVEN: Profile with specific financial need level
      const profileData = createProfileData({
        financialNeed: value,
      })

      // WHEN: Creating profile
      const response = await apiHelper.trpc('profile.create', profileData)

      // THEN: Profile is created successfully
      expect(response.status).toBe(200)
      const profile = await response.json()
      expect(profile.result.data.financialNeed).toBe(value)
    }
  })

  test('should reject invalid financial need value', async () => {
    // GIVEN: Profile with invalid financial need
    const profileData = createProfileData({
      financialNeed: 'INVALID_VALUE',
    })

    // WHEN: Creating profile
    const response = await apiHelper.trpc('profile.create', profileData)

    // THEN: Request fails with validation error
    expect(response.status).toBe(400)
  })
})
