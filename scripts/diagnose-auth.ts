import { prisma } from '../src/server/db'

/**
 * Diagnostic script to check auth status
 * Run: npx tsx scripts/diagnose-auth.ts
 */

async function diagnose() {
  try {
    console.log('=== Authentication Diagnostic ===\n')

    // Check all users in database
    const users = await prisma.user.findMany({
      include: {
        student: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log(`Found ${users.length} user(s) in database:\n`)

    if (users.length === 0) {
      console.log('✗ No users found in database!')
      console.log('\nThis explains the 401 errors.')
      console.log('You need to create a User record for your Clerk account.')
      console.log('\nTo fix:')
      console.log('1. Get your Clerk user ID from the browser DevTools:')
      console.log('   - Open DevTools Console')
      console.log('   - Type: window.Clerk.user.id')
      console.log('   - Copy the ID')
      console.log('2. Edit scripts/create-user-simple.ts and update CLERK_ID')
      console.log('3. Run: npx tsx scripts/create-user-simple.ts')
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`)
        console.log(`   Clerk ID: ${user.clerkId}`)
        console.log(`   User ID: ${user.id}`)
        console.log(`   Role: ${user.role}`)
        console.log(`   Has Student: ${user.student ? '✓ Yes' : '✗ No'}`)
        if (user.student) {
          console.log(`   Student ID: ${user.student.id}`)
          console.log(`   Name: ${user.student.firstName} ${user.student.lastName}`)
        }
        console.log('')
      })

      console.log('\n✓ Users exist in database.')
      console.log('\nIf you\'re still getting 401 errors, your Clerk ID might not match.')
      console.log('Check your browser console and compare the clerkId being used.')
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

diagnose()
