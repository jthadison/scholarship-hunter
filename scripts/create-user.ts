/**
 * Script to create a User and Student record in the database
 * Run with: npx tsx scripts/create-user.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Creating user and student records...')

  // Get Clerk ID from environment or use the discovered ID
  const clerkId = process.env.CLERK_USER_ID || 'user_34tLCZLlk6YzbFPkHfCzzEXDrha'
  const email = process.env.USER_EMAIL || 'j.thadison@gmail.com'
  const firstName = process.env.USER_FIRST_NAME || 'John'
  const lastName = process.env.USER_LAST_NAME || 'Thadison'

  console.log(`Checking for existing user with Clerk ID: ${clerkId}`)

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { clerkId },
    include: { student: true },
  })

  if (existingUser) {
    console.log('✅ User already exists!')
    console.log('User ID:', existingUser.id)
    console.log('Email:', existingUser.email)
    console.log('Student ID:', existingUser.student?.id)
    return existingUser
  }

  // Create new user and student
  console.log(`Creating new user: ${email}`)

  const user = await prisma.user.create({
    data: {
      clerkId,
      email,
      role: 'STUDENT',
      emailVerified: true,
      student: {
        create: {
          firstName,
          lastName,
        },
      },
    },
    include: { student: true },
  })

  console.log('✅ User and Student created successfully!')
  console.log('User ID:', user.id)
  console.log('Email:', user.email)
  console.log('Student ID:', user.student?.id)
  console.log('Student Name:', `${user.student?.firstName} ${user.student?.lastName}`)

  return user
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
