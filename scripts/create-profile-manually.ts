import { prisma } from '../src/server/db'

/**
 * Manually create a profile for testing
 * Run: npx tsx scripts/create-profile-manually.ts
 */

const STUDENT_ID = 'cmhgm0fny000192swmecyiw8j' // Your student ID from earlier

async function createProfile() {
  try {
    console.log('Creating profile for student:', STUDENT_ID)

    // Check if profile already exists
    const existing = await prisma.profile.findUnique({
      where: { studentId: STUDENT_ID },
    })

    if (existing) {
      console.log('\n✓ Profile already exists!')
      console.log(`  Profile ID: ${existing.id}`)
      console.log(`  Completion: ${existing.completionPercentage}%`)
      return
    }

    // Create minimal profile with the data you entered
    const profile = await prisma.profile.create({
      data: {
        studentId: STUDENT_ID,
        gpa: 3.75,
        gpaScale: 4.0,
        actScore: 23,
        graduationYear: 2029,
        currentGrade: 'College Freshman',
        gender: 'Male',
        ethnicity: ['Black/African American'],
        state: 'IA',
        citizenship: 'US Citizen',
        intendedMajor: 'Business',
        financialNeed: 'MODERATE',
        completionPercentage: 50, // Rough estimate
        strengthScore: 65, // Rough estimate
      },
    })

    console.log('\n✓ Profile created successfully!')
    console.log(`  Profile ID: ${profile.id}`)
    console.log(`  Completion: ${profile.completionPercentage}%`)
    console.log('\n✓ Try refreshing your browser at http://localhost:3000/shelby')
  } catch (error) {
    console.error('\n✗ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createProfile()
