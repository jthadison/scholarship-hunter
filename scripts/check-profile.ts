import { prisma } from '../src/server/db'

async function checkProfile() {
  // Get the first student's profile
  const student = await prisma.student.findFirst({
    include: {
      profile: true,
    },
  })

  if (!student || !student.profile) {
    console.log('No profile found')
    return
  }

  const profile = student.profile

  console.log('Profile ID:', profile.id)
  console.log('Completion Percentage:', profile.completionPercentage)
  console.log('Strength Score:', profile.strengthScore)
  console.log('\nExperience Fields:')
  console.log('  extracurriculars:', JSON.stringify(profile.extracurriculars, null, 2))
  console.log('  workExperience:', JSON.stringify(profile.workExperience, null, 2))
  console.log('  leadershipRoles:', JSON.stringify(profile.leadershipRoles, null, 2))
  console.log('  awardsHonors:', JSON.stringify(profile.awardsHonors, null, 2))
  console.log('  volunteerHours:', profile.volunteerHours)

  await prisma.$disconnect()
}

checkProfile()
