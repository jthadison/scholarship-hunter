import { prisma } from '../src/server/db'

async function diagnoseProfile() {
  try {
    // Find all users
    const users = await prisma.user.findMany({
      include: {
        student: {
          include: {
            profile: true,
          },
        },
      },
    })

    console.log('=== PROFILE DIAGNOSIS ===\n')

    for (const user of users) {
      console.log(`User: ${user.email} (ID: ${user.id})`)

      if (user.student) {
        const student = user.student
        console.log(`  Student: ${student.firstName} ${student.lastName} (ID: ${student.id})`)

        if (student.profile) {
          const profile = student.profile
          console.log('  Profile:')
          console.log(`    - graduationYear: ${profile.graduationYear} (type: ${typeof profile.graduationYear})`)
          console.log(`    - citizenship: ${profile.citizenship} (type: ${typeof profile.citizenship})`)
          console.log(`    - state: ${profile.state} (type: ${typeof profile.state})`)
          console.log(`    - financialNeed: ${profile.financialNeed} (type: ${typeof profile.financialNeed})`)
          console.log(`    - intendedMajor: ${profile.intendedMajor}`)
          console.log(`    - fieldOfStudy: ${profile.fieldOfStudy}`)
          console.log(`    - completionPercentage: ${profile.completionPercentage}`)
        } else {
          console.log('  Profile: NOT FOUND')
        }
      } else {
        console.log('  No student record')
      }
      console.log('')
    }

    console.log('\n=== END DIAGNOSIS ===')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

diagnoseProfile()
