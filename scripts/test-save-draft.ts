import { prisma } from '../src/server/db'

async function testSaveDraft() {
  try {
    // Find the user j.thadison@gmail.com
    const user = await prisma.user.findUnique({
      where: { email: 'j.thadison@gmail.com' },
      include: {
        student: {
          include: {
            profile: true,
          },
        },
      },
    })

    if (!user) {
      console.log('❌ User not found')
      return
    }

    console.log('✅ User found:', user.email)

    if (!user.student) {
      console.log('❌ Student not found')
      return
    }

    console.log('✅ Student found:', user.student.id)
    console.log('   Current profile:', user.student.profile ? 'EXISTS' : 'MISSING')

    // Try to create a profile directly
    if (!user.student.profile) {
      console.log('\n🔧 Creating test profile...')

      const profile = await prisma.profile.create({
        data: {
          studentId: user.student.id,
          gpa: 4.0,
          gpaScale: 4.0,
          actScore: 25,
          graduationYear: 2026,
          currentGrade: '12th Grade',
          state: 'IA',
          citizenship: 'US Citizen',
          financialNeed: 'MODERATE',
          intendedMajor: 'Computer Engineering',
          fieldOfStudy: 'STEM',
          completionPercentage: 50,
          strengthScore: 0,
        },
      })

      console.log('✅ Profile created successfully!')
      console.log('   Profile ID:', profile.id)
      console.log('   Graduation Year:', profile.graduationYear)
      console.log('   State:', profile.state)
      console.log('   Financial Need:', profile.financialNeed)
    } else {
      console.log('\n✅ Profile already exists')
    }
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testSaveDraft()
