import { prisma } from '../src/server/db'

/**
 * Simple script to create User and Student records
 * Usage: Update the variables below with your info, then run: npx tsx scripts/create-user-simple.ts
 */

// ⚠️ UPDATE THESE VALUES WITH YOUR INFO:
const CLERK_ID = 'user_34a4afeComnGVHrKBfDUFDvwtu6' // Your actual Clerk ID
const EMAIL = 'jthadison@gmail.com'
const FIRST_NAME = 'John'
const LAST_NAME = 'Thadison'

async function createUser() {
  try {
    console.log('Creating user and student records...')
    console.log(`Clerk ID: ${CLERK_ID}`)
    console.log(`Email: ${EMAIL}`)

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { clerkId: CLERK_ID },
      include: { student: true },
    })

    if (existing) {
      console.log('\n✓ User already exists!')
      console.log(`  User ID: ${existing.id}`)
      if (existing.student) {
        console.log(`  Student ID: ${existing.student.id}`)
        console.log('\n✓ All set! Try refreshing your browser.')
      } else {
        console.log('  Creating missing student record...')
        const student = await prisma.student.create({
          data: {
            userId: existing.id,
            firstName: FIRST_NAME,
            lastName: LAST_NAME,
          },
        })
        console.log(`  ✓ Student created: ${student.id}`)
        console.log('\n✓ All set! Try refreshing your browser.')
      }
      return
    }

    // Create new user with student
    const user = await prisma.user.create({
      data: {
        clerkId: CLERK_ID,
        email: EMAIL,
        emailVerified: true,
        role: 'STUDENT',
        student: {
          create: {
            firstName: FIRST_NAME,
            lastName: LAST_NAME,
          },
        },
      },
      include: {
        student: true,
      },
    })

    console.log('\n✓ User and Student created successfully!')
    console.log(`  User ID: ${user.id}`)
    console.log(`  Student ID: ${user.student?.id}`)
    console.log('\n✓ All set! Try refreshing your browser at http://localhost:3000/shelby')
  } catch (error) {
    console.error('\n✗ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createUser()
