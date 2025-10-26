/**
 * User Factory
 *
 * Creates test users with automatic cleanup.
 * Integrates with Clerk for authentication and Prisma for database records.
 *
 * Usage:
 *   const user = await userFactory.createUser({ email: 'custom@example.com' })
 *
 * Features:
 *   - Faker-based realistic data generation
 *   - Override any field with custom values
 *   - Auto-cleanup on test completion
 *   - Creates both Clerk user and database record
 */

import { faker } from '@faker-js/faker'
import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

export interface UserFactoryOptions {
  email?: string
  role?: UserRole
  firstName?: string
  lastName?: string
  emailVerified?: boolean
  withProfile?: boolean
}

export interface TestUser {
  id: string
  clerkId: string
  email: string
  role: UserRole
  emailVerified: boolean
  student?: {
    id: string
    firstName: string
    lastName: string
    profile?: any
  }
}

export class UserFactory {
  private createdUserIds: string[] = []
  private createdClerkIds: string[] = []

  /**
   * Create a test user with optional overrides
   *
   * @param overrides - Custom values to override defaults
   * @returns Created user object
   */
  async createUser(overrides: UserFactoryOptions = {}): Promise<TestUser> {
    const email = overrides.email || faker.internet.email()
    const firstName = overrides.firstName || faker.person.firstName()
    const lastName = overrides.lastName || faker.person.lastName()
    const role = overrides.role || UserRole.STUDENT

    // Generate a mock Clerk ID (in real tests, you'd call Clerk API)
    const clerkId = `clerk_test_${faker.string.alphanumeric(24)}`

    // Create user in database
    const user = await prisma.user.create({
      data: {
        clerkId,
        email,
        emailVerified: overrides.emailVerified ?? true,
        role,
        student:
          role === UserRole.STUDENT
            ? {
                create: {
                  firstName,
                  lastName,
                  dateOfBirth: faker.date.birthdate({ min: 14, max: 25, mode: 'age' }),
                  phone: faker.phone.number(),
                  ...(overrides.withProfile && {
                    profile: {
                      create: this.generateProfileData(),
                    },
                  }),
                },
              }
            : undefined,
      },
      include: {
        student: {
          include: {
            profile: overrides.withProfile || false,
          },
        },
      },
    })

    // Track for cleanup
    this.createdUserIds.push(user.id)
    this.createdClerkIds.push(clerkId)

    return user as TestUser
  }

  /**
   * Create a user with a complete profile
   */
  async createUserWithProfile(overrides: UserFactoryOptions = {}): Promise<TestUser> {
    return this.createUser({ ...overrides, withProfile: true })
  }

  /**
   * Create an admin user
   */
  async createAdmin(overrides: UserFactoryOptions = {}): Promise<TestUser> {
    return this.createUser({ ...overrides, role: UserRole.ADMIN })
  }

  /**
   * Generate realistic profile data
   */
  private generateProfileData() {
    return {
      // Academic
      gpa: faker.number.float({ min: 2.0, max: 4.0, fractionDigits: 2 }),
      gpaScale: 4.0,
      satScore: faker.number.int({ min: 800, max: 1600 }),
      actScore: faker.number.int({ min: 10, max: 36 }),
      graduationYear: new Date().getFullYear() + faker.number.int({ min: 0, max: 4 }),
      currentGrade: faker.helpers.arrayElement(['9th', '10th', '11th', '12th', 'College Freshman']),

      // Demographics
      gender: faker.helpers.arrayElement(['Male', 'Female', 'Non-binary', 'Prefer not to say']),
      ethnicity: [faker.helpers.arrayElement(['Asian', 'Black', 'Hispanic', 'White', 'Native American', 'Pacific Islander'])],
      state: faker.location.state({ abbreviated: true }),
      city: faker.location.city(),
      zipCode: faker.location.zipCode(),
      citizenship: 'US Citizen',

      // Financial
      financialNeed: faker.helpers.arrayElement(['LOW', 'MODERATE', 'HIGH', 'VERY_HIGH']),
      pellGrantEligible: faker.datatype.boolean(),

      // Major & Field
      intendedMajor: faker.helpers.arrayElement([
        'Computer Science',
        'Engineering',
        'Biology',
        'Business',
        'Psychology',
        'English',
        'Mathematics',
      ]),
      fieldOfStudy: 'STEM',
      careerGoals: faker.lorem.paragraph(),

      // Experience
      volunteerHours: faker.number.int({ min: 0, max: 500 }),
      firstGeneration: faker.datatype.boolean(),

      // Metadata
      completionPercentage: faker.number.float({ min: 50, max: 100, fractionDigits: 2 }),
      strengthScore: faker.number.float({ min: 60, max: 95, fractionDigits: 2 }),
    }
  }

  /**
   * Clean up all created users
   * Called automatically by fixture teardown
   */
  async cleanup(): Promise<void> {
    if (this.createdUserIds.length === 0) return

    // Delete users (cascades to students, profiles, etc.)
    await prisma.user.deleteMany({
      where: {
        id: {
          in: this.createdUserIds,
        },
      },
    })

    // TODO: In production, also delete Clerk users
    // for (const clerkId of this.createdClerkIds) {
    //   await clerkClient.users.deleteUser(clerkId)
    // }

    this.createdUserIds = []
    this.createdClerkIds = []
  }
}
