import { PrismaClient, ApplicationStatus, EssayPhase, DocumentType, FinancialNeed } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing data (in reverse order of dependencies)
  console.log("🗑️  Clearing existing data...");
  await prisma.analyticsSnapshot.deleteMany();
  await prisma.outcome.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.essay.deleteMany();
  await prisma.document.deleteMany();
  await prisma.timeline.deleteMany();
  await prisma.application.deleteMany();
  await prisma.match.deleteMany();
  await prisma.scholarship.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();

  // Create sample users and students
  console.log("👥 Creating users and students...");
  const students = await createStudents();

  // Create scholarships
  console.log("🎓 Creating scholarships...");
  const scholarships = await createScholarships();

  // Create profiles for students
  console.log("📋 Creating student profiles...");
  await createProfiles(students);

  // Create sample applications
  console.log("📝 Creating applications...");
  await createApplications(students, scholarships);

  // Create sample essays
  console.log("✍️  Creating essays...");
  await createEssays(students);

  // Create sample documents
  console.log("📄 Creating documents...");
  await createDocuments(students);

  console.log("✅ Seed completed successfully!");
}

async function createStudents() {
  const studentsData = [
    {
      user: {
        clerkId: `user_${Date.now()}_1`,
        email: "emily.chen@example.com",
        emailVerified: true,
      },
      firstName: "Emily",
      lastName: "Chen",
      phone: "+1-555-0101",
    },
    {
      user: {
        clerkId: `user_${Date.now()}_2`,
        email: "marcus.johnson@example.com",
        emailVerified: true,
      },
      firstName: "Marcus",
      lastName: "Johnson",
      phone: "+1-555-0102",
    },
    {
      user: {
        clerkId: `user_${Date.now()}_3`,
        email: "sofia.rodriguez@example.com",
        emailVerified: true,
      },
      firstName: "Sofia",
      lastName: "Rodriguez",
      phone: "+1-555-0103",
    },
    {
      user: {
        clerkId: `user_${Date.now()}_4`,
        email: "david.kim@example.com",
        emailVerified: true,
      },
      firstName: "David",
      lastName: "Kim",
      phone: "+1-555-0104",
    },
    {
      user: {
        clerkId: `user_${Date.now()}_5`,
        email: "aisha.patel@example.com",
        emailVerified: true,
      },
      firstName: "Aisha",
      lastName: "Patel",
      phone: "+1-555-0105",
    },
    {
      user: {
        clerkId: `user_${Date.now()}_6`,
        email: "james.wilson@example.com",
        emailVerified: true,
      },
      firstName: "James",
      lastName: "Wilson",
      phone: "+1-555-0106",
    },
    {
      user: {
        clerkId: `user_${Date.now()}_7`,
        email: "maria.garcia@example.com",
        emailVerified: true,
      },
      firstName: "Maria",
      lastName: "Garcia",
      phone: "+1-555-0107",
    },
    {
      user: {
        clerkId: `user_${Date.now()}_8`,
        email: "ryan.thompson@example.com",
        emailVerified: true,
      },
      firstName: "Ryan",
      lastName: "Thompson",
      phone: "+1-555-0108",
    },
    {
      user: {
        clerkId: `user_${Date.now()}_9`,
        email: "priya.sharma@example.com",
        emailVerified: true,
      },
      firstName: "Priya",
      lastName: "Sharma",
      phone: "+1-555-0109",
    },
    {
      user: {
        clerkId: `user_${Date.now()}_10`,
        email: "alex.martinez@example.com",
        emailVerified: true,
      },
      firstName: "Alex",
      lastName: "Martinez",
      phone: "+1-555-0110",
    },
  ];

  const students = [];
  for (const data of studentsData) {
    const student = await prisma.student.create({
      data: {
        user: {
          create: data.user,
        },
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      },
      include: { user: true },
    });
    students.push(student);
  }

  return students;
}

async function createProfiles(students: any[]) {
  const profilesData = [
    {
      gpa: 3.9,
      satScore: 1450,
      actScore: 33,
      graduationYear: 2025,
      gender: "Female",
      ethnicity: ["Asian"],
      state: "CA",
      financialNeed: "MODERATE" as FinancialNeed,
      intendedMajor: "Computer Science",
      volunteerHours: 200,
      firstGeneration: false,
    },
    {
      gpa: 3.7,
      satScore: 1380,
      graduationYear: 2025,
      gender: "Male",
      ethnicity: ["Black/African American"],
      state: "TX",
      financialNeed: "HIGH" as FinancialNeed,
      pellGrantEligible: true,
      intendedMajor: "Engineering",
      volunteerHours: 150,
      firstGeneration: true,
    },
    {
      gpa: 4.0,
      satScore: 1550,
      actScore: 35,
      graduationYear: 2025,
      gender: "Female",
      ethnicity: ["Hispanic/Latinx"],
      state: "FL",
      financialNeed: "MODERATE" as FinancialNeed,
      intendedMajor: "Pre-Med",
      volunteerHours: 300,
      firstGeneration: false,
    },
    {
      gpa: 3.5,
      satScore: 1280,
      graduationYear: 2026,
      gender: "Male",
      ethnicity: ["Asian"],
      state: "WA",
      financialNeed: "LOW" as FinancialNeed,
      intendedMajor: "Business",
      volunteerHours: 100,
      firstGeneration: false,
    },
    {
      gpa: 3.8,
      actScore: 32,
      graduationYear: 2025,
      gender: "Female",
      ethnicity: ["Asian", "Middle Eastern"],
      state: "NY",
      financialNeed: "VERY_HIGH" as FinancialNeed,
      pellGrantEligible: true,
      intendedMajor: "Biology",
      volunteerHours: 250,
      firstGeneration: true,
    },
    {
      gpa: 3.2,
      satScore: 1150,
      graduationYear: 2026,
      gender: "Male",
      ethnicity: ["White"],
      state: "OH",
      financialNeed: "HIGH" as FinancialNeed,
      intendedMajor: "Liberal Arts",
      volunteerHours: 80,
      militaryAffiliation: "Veteran's Child",
    },
    {
      gpa: 3.6,
      satScore: 1320,
      graduationYear: 2025,
      gender: "Female",
      ethnicity: ["Hispanic/Latinx"],
      state: "AZ",
      financialNeed: "MODERATE" as FinancialNeed,
      intendedMajor: "Education",
      volunteerHours: 180,
      firstGeneration: true,
    },
    {
      gpa: 3.4,
      actScore: 28,
      graduationYear: 2026,
      gender: "Male",
      ethnicity: ["White"],
      state: "MI",
      financialNeed: "LOW" as FinancialNeed,
      intendedMajor: "Engineering",
      volunteerHours: 50,
    },
    {
      gpa: 3.95,
      satScore: 1520,
      actScore: 34,
      graduationYear: 2025,
      gender: "Female",
      ethnicity: ["Asian"],
      state: "MA",
      financialNeed: "LOW" as FinancialNeed,
      intendedMajor: "Mathematics",
      volunteerHours: 220,
    },
    {
      gpa: 2.8,
      satScore: 1050,
      graduationYear: 2026,
      gender: "Non-binary",
      ethnicity: ["Hispanic/Latinx", "Native American"],
      state: "NM",
      financialNeed: "VERY_HIGH" as FinancialNeed,
      pellGrantEligible: true,
      intendedMajor: "Sociology",
      volunteerHours: 120,
      firstGeneration: true,
    },
  ];

  for (let i = 0; i < students.length; i++) {
    await prisma.profile.create({
      data: {
        studentId: students[i].id,
        ...profilesData[i],
      },
    });
  }
}

async function createScholarships() {
  const scholarshipsData = [];
  const categories = [
    "Merit-Based",
    "Need-Based",
    "STEM",
    "Humanities",
    "Athletic",
    "Community Service",
    "First Generation",
    "Minority",
    "Women in Tech",
    "Military/Veteran",
  ];

  // Create 100+ diverse scholarships
  for (let i = 1; i <= 110; i++) {
    const category = categories[i % categories.length]!;
    const awardAmount = [500, 1000, 2500, 5000, 10000, 15000, 25000][Math.floor(Math.random() * 7)]!;
    const deadline = new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);

    scholarshipsData.push({
      name: `${category} Scholarship #${i}`,
      provider: `Organization ${Math.floor(i / 10) + 1}`,
      description: `A $${awardAmount} scholarship for ${category.toLowerCase()} students with diverse backgrounds and achievements.`,
      website: `https://example.com/scholarship-${i}`,
      awardAmount,
      deadline,
      verified: Math.random() > 0.3,
      tags: [category, `Award-${awardAmount}`],
      category,
      numberOfAwards: Math.floor(Math.random() * 10) + 1,
      renewable: Math.random() > 0.7,
      recommendationCount: Math.floor(Math.random() * 3),
    });
  }

  const scholarships = [];
  for (const data of scholarshipsData) {
    const scholarship = await prisma.scholarship.create({ data: data as any });
    scholarships.push(scholarship);
  }

  return scholarships;
}

async function createApplications(students: any[], scholarships: any[]) {
  const statuses: ApplicationStatus[] = [
    "NOT_STARTED",
    "TODO",
    "IN_PROGRESS",
    "READY_FOR_REVIEW",
    "SUBMITTED",
    "AWARDED",
    "DENIED",
  ];

  // Create 20 sample applications
  for (let i = 0; i < 20; i++) {
    const student = students[i % students.length];
    const scholarship = scholarships[i % scholarships.length];
    const status = statuses[i % statuses.length];

    await prisma.application.create({
      data: {
        studentId: student.id,
        scholarshipId: scholarship.id,
        status,
        progressPercentage: Math.floor(Math.random() * 100),
        essayCount: Math.floor(Math.random() * 3),
        documentsRequired: 3,
        documentsUploaded: Math.floor(Math.random() * 4),
        recsRequired: scholarship.recommendationCount,
        recsReceived: Math.floor(Math.random() * (scholarship.recommendationCount + 1)),
        targetSubmitDate: new Date(2025, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1),
      },
    });
  }
}

async function createEssays(students: any[]) {
  const phases: EssayPhase[] = ["DISCOVERY", "STRUCTURE", "DRAFTING", "REVISION", "POLISH", "FINALIZATION"];
  const prompts = [
    "Describe a time you faced a challenge and how you overcame it.",
    "What are your career goals and how will this scholarship help you achieve them?",
    "Tell us about a person who has significantly influenced your life.",
    "Discuss a time when you demonstrated leadership.",
    "What does diversity mean to you?",
  ];

  // Create 15 sample essays at different phases
  for (let i = 0; i < 15; i++) {
    const student = students[i % students.length];
    const phase = phases[i % phases.length]!;
    const prompt = prompts[i % prompts.length]!;

    await prisma.essay.create({
      data: {
        studentId: student.id,
        title: `Essay ${i + 1}`,
        prompt,
        content: `This is a sample essay content for ${prompt.substring(0, 30)}...`,
        wordCount: 250 + Math.floor(Math.random() * 500),
        phase,
        isComplete: phase === "FINALIZATION",
        aiGenerated: Math.random() > 0.7,
        aiModel: Math.random() > 0.7 ? "GPT-4" : undefined,
        qualityScore: 60 + Math.floor(Math.random() * 40),
        themes: ["Leadership", "Perseverance", "Community"],
      },
    });
  }
}

async function createDocuments(students: any[]) {
  const types: DocumentType[] = ["TRANSCRIPT", "RESUME", "PERSONAL_STATEMENT", "FINANCIAL_DOCUMENT"];

  // Create 10 sample document metadata entries
  for (let i = 0; i < 10; i++) {
    const student = students[i % students.length];
    const type = types[i % types.length]!;

    await prisma.document.create({
      data: {
        studentId: student.id,
        name: `${type} - ${student.firstName} ${student.lastName}`,
        type,
        fileName: `${type.toLowerCase()}_${i + 1}.pdf`,
        fileSize: 100000 + Math.floor(Math.random() * 500000),
        mimeType: "application/pdf",
        storagePath: `/documents/${student.id}/${type.toLowerCase()}_${i + 1}.pdf`,
        compliant: Math.random() > 0.2,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
