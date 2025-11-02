import { prisma } from '../src/server/db'

async function checkScholarships() {
  const scholarships = await prisma.scholarship.findMany({
    select: {
      id: true,
      name: true,
      provider: true,
      awardAmount: true,
      verified: true,
    },
  })

  console.log('Total scholarships:', scholarships.length)
  console.log('\nScholarships:')
  scholarships.forEach((s) => {
    console.log(
      '  -',
      s.name,
      '|',
      s.provider,
      '|',
      s.awardAmount ? '$' + s.awardAmount : 'N/A',
      '| verified:',
      s.verified
    )
  })

  await prisma.$disconnect()
}

checkScholarships()
