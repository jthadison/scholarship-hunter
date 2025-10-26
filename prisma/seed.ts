import { PrismaClient, ApplicationStatus, EssayPhase, DocumentType, FinancialNeed, Prisma } from "@prisma/client";
import { ScholarshipTemplates, EligibilityPatterns, createScholarship, validateScholarshipData } from "./seed-utils/scholarship-factory";

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
  const scholarships = [];

  // Create featured template scholarships with proper eligibility criteria
  console.log("  Creating featured scholarships with eligibility criteria...");

  // High Merit Scholarship
  const highMerit = ScholarshipTemplates.highMerit();
  validateScholarshipData(highMerit);
  scholarships.push(await prisma.scholarship.create({ data: highMerit }));

  // Need-Based Scholarship
  const needBased = ScholarshipTemplates.needBased();
  validateScholarshipData(needBased);
  scholarships.push(await prisma.scholarship.create({ data: needBased }));

  // STEM Scholarship
  const stemScholarship = ScholarshipTemplates.stemScholarship();
  validateScholarshipData(stemScholarship);
  scholarships.push(await prisma.scholarship.create({ data: stemScholarship }));

  // Women in STEM
  const womenInStem = createScholarship({
    name: "Women in STEM Excellence Award",
    provider: "National STEM Foundation",
    description: "Supporting women pursuing STEM degrees with demonstrated academic excellence and commitment to innovation.",
    awardAmount: 5000,
    numberOfAwards: 10,
    renewable: true,
    renewalYears: 4,
    deadline: new Date("2025-12-15"),
    eligibilityCriteria: EligibilityPatterns.womenInStem() as Prisma.InputJsonValue,
    essayPrompts: [
      {
        prompt: "Describe a challenge you overcame in pursuing STEM education",
        wordLimit: 750,
        required: true,
      },
    ],
    requiredDocuments: ["Transcript", "Resume"],
    recommendationCount: 1,
    tags: ["STEM", "Women", "Merit-based"],
    category: "Merit-based",
    verified: true,
  });
  validateScholarshipData(womenInStem);
  scholarships.push(await prisma.scholarship.create({ data: womenInStem }));

  // First Generation Scholarship
  const firstGen = createScholarship({
    name: "First Generation Scholars Program",
    provider: "Educational Opportunity Foundation",
    description: "Empowering first-generation college students to break barriers and achieve their educational dreams.",
    awardAmount: 3000,
    numberOfAwards: 50,
    deadline: new Date("2026-02-28"),
    eligibilityCriteria: EligibilityPatterns.firstGeneration() as Prisma.InputJsonValue,
    requiredDocuments: ["FAFSA", "Personal Statement"],
    recommendationCount: 1,
    tags: ["First Generation", "Need-based"],
    category: "Need-based",
    verified: true,
  });
  validateScholarshipData(firstGen);
  scholarships.push(await prisma.scholarship.create({ data: firstGen }));

  // Community Service Scholarship
  const communityService = createScholarship({
    name: "Community Champions Scholarship",
    provider: "Civic Engagement Alliance",
    description: "Recognizing students who demonstrate exceptional commitment to community service and social impact.",
    awardAmount: 2000,
    numberOfAwards: 30,
    deadline: new Date("2026-01-31"),
    eligibilityCriteria: EligibilityPatterns.communityService() as Prisma.InputJsonValue,
    essayPrompts: [
      {
        prompt: "Describe your most meaningful community service experience and its impact",
        wordLimit: 500,
        required: true,
      },
    ],
    requiredDocuments: ["Service Verification Form"],
    tags: ["Community Service", "Leadership"],
    category: "Merit-based",
    verified: true,
  });
  validateScholarshipData(communityService);
  scholarships.push(await prisma.scholarship.create({ data: communityService }));

  // Leadership Scholarship
  const leadership = createScholarship({
    name: "Future Leaders Scholarship",
    provider: "Leadership Development Institute",
    description: "Investing in student leaders who demonstrate potential to create positive change in their communities.",
    awardAmount: 4000,
    numberOfAwards: 20,
    renewable: true,
    renewalYears: 2,
    deadline: new Date("2025-11-15"),
    eligibilityCriteria: EligibilityPatterns.leadership() as Prisma.InputJsonValue,
    essayPrompts: [
      {
        prompt: "Describe a leadership role and how it shaped your perspective",
        wordLimit: 600,
        required: true,
      },
    ],
    requiredDocuments: ["Leadership Portfolio"],
    recommendationCount: 2,
    tags: ["Leadership", "Merit-based"],
    category: "Merit-based",
    verified: true,
  });
  validateScholarshipData(leadership);
  scholarships.push(await prisma.scholarship.create({ data: leadership }));

  // Geographic-specific scholarships
  const caResidents = createScholarship({
    name: "California Futures Scholarship",
    provider: "California Education Foundation",
    description: "Supporting California residents in pursuing higher education and contributing to the state's future.",
    awardAmount: 3500,
    numberOfAwards: 100,
    deadline: new Date("2025-12-31"),
    eligibilityCriteria: EligibilityPatterns.geographic(["CA"]) as Prisma.InputJsonValue,
    requiredDocuments: ["Proof of Residency"],
    tags: ["California", "Regional"],
    category: "Merit-based",
    verified: true,
  });
  validateScholarshipData(caResidents);
  scholarships.push(await prisma.scholarship.create({ data: caResidents }));

  // Underrepresented minorities
  const underrepresented = createScholarship({
    name: "Diversity in Education Scholarship",
    provider: "Equity and Inclusion Institute",
    description: "Promoting diversity in higher education by supporting underrepresented students in their academic journey.",
    awardAmount: 2500,
    numberOfAwards: 40,
    deadline: new Date("2026-03-15"),
    eligibilityCriteria: EligibilityPatterns.underrepresented(["Hispanic/Latinx", "African American", "Native American"]) as Prisma.InputJsonValue,
    tags: ["Diversity", "Inclusion", "Identity-based"],
    category: "Identity-based",
    verified: true,
  });
  validateScholarshipData(underrepresented);
  scholarships.push(await prisma.scholarship.create({ data: underrepresented }));

  // Military Affiliation
  const military = createScholarship({
    name: "Military Family Scholarship",
    provider: "Veterans Education Fund",
    description: "Honoring the sacrifice of military families by supporting educational opportunities for dependents.",
    awardAmount: 5000,
    numberOfAwards: 15,
    renewable: true,
    renewalYears: 4,
    deadline: new Date("2025-10-31"),
    eligibilityCriteria: EligibilityPatterns.military() as Prisma.InputJsonValue,
    requiredDocuments: ["Military Dependent ID"],
    tags: ["Military", "Veterans", "Identity-based"],
    category: "Identity-based",
    verified: true,
  });
  validateScholarshipData(military);
  scholarships.push(await prisma.scholarship.create({ data: military }));

  console.log(`  Created ${scholarships.length} scholarships with proper eligibility criteria`);

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
