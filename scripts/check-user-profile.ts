import { prisma } from '../src/server/db'

async function checkUserProfile() {
  const userEmail = 'j.thadison@gmail.com' // Your email from .env.test

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      student: {
        include: {
          profile: true,
        },
      },
    },
  })

  if (!user) {
    console.log('User not found')
    return
  }

  console.log('User found:', user.email)

  if (!user.student) {
    console.log('No student record found')
    return
  }

  console.log('Student ID:', user.student.id)

  if (!user.student.profile) {
    console.log('No profile found')
    return
  }

  const profile = user.student.profile

  console.log('\n=== PROFILE DATA ===')
  console.log('Completion Percentage:', profile.completionPercentage + '%')
  console.log('Strength Score:', profile.strengthScore)

  console.log('\n=== EXPERIENCE FIELDS ===')
  console.log('Extracurriculars:', JSON.stringify(profile.extracurriculars, null, 2))
  console.log('Work Experience:', JSON.stringify(profile.workExperience, null, 2))
  console.log('Leadership Roles:', JSON.stringify(profile.leadershipRoles, null, 2))
  console.log('Awards & Honors:', JSON.stringify(profile.awardsHonors, null, 2))
  console.log('Volunteer Hours:', profile.volunteerHours)

  console.log('\n=== OTHER FIELDS ===')
  console.log('GPA:', profile.gpa)
  console.log('Graduation Year:', profile.graduationYear)
  console.log('Intended Major:', profile.intendedMajor)
  console.log('Field of Study:', profile.fieldOfStudy)
  console.log('State:', profile.state)
  console.log('Citizenship:', profile.citizenship)

  await prisma.$disconnect()
}

checkUserProfile()
