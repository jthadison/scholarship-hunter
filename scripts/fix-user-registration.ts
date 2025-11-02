import { prisma } from '../src/server/db'
import { clerkClient } from '@clerk/nextjs/server'

/**
 * Script to fix missing user registration
 * Creates User and Student records for authenticated Clerk users
 */
async function fixUserRegistration() {
  try {
    // Get all users from Clerk
    console.log('Fetching users from Clerk...')
    const clerkUsers = await clerkClient.users.getUserList()

    console.log(`Found ${clerkUsers.totalCount} users in Clerk`)

    for (const clerkUser of clerkUsers.data) {
      console.log(`\nChecking user: ${clerkUser.emailAddresses[0]?.emailAddress}`)

      // Check if user exists in database
      const existingUser = await prisma.user.findUnique({
        where: { clerkId: clerkUser.id },
        include: { student: true },
      })

      if (existingUser) {
        console.log(`  ✓ User exists in database (ID: ${existingUser.id})`)
        if (existingUser.student) {
          console.log(`  ✓ Student record exists (ID: ${existingUser.student.id})`)
        } else {
          console.log(`  ✗ Missing Student record - creating...`)
          await prisma.student.create({
            data: {
              userId: existingUser.id,
              firstName: clerkUser.firstName || '',
              lastName: clerkUser.lastName || '',
            },
          })
          console.log(`  ✓ Student record created`)
        }
      } else {
        console.log(`  ✗ User not in database - creating...`)

        const primaryEmail = clerkUser.emailAddresses.find(
          (e) => e.id === clerkUser.primaryEmailAddressId
        )

        if (!primaryEmail) {
          console.log(`  ✗ No primary email found - skipping`)
          continue
        }

        const user = await prisma.user.create({
          data: {
            clerkId: clerkUser.id,
            email: primaryEmail.emailAddress,
            emailVerified: primaryEmail.verification?.status === 'verified',
            role: 'STUDENT',
            student: {
              create: {
                firstName: clerkUser.firstName || '',
                lastName: clerkUser.lastName || '',
              },
            },
          },
          include: { student: true },
        })

        console.log(`  ✓ User created (ID: ${user.id})`)
        console.log(`  ✓ Student created (ID: ${user.student?.id})`)
      }
    }

    console.log('\n✓ Registration fix complete!')
  } catch (error) {
    console.error('Error fixing user registration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixUserRegistration()
