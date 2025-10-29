import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Manually specify your Clerk user details here
// You can find your Clerk ID in the browser console error or Clerk Dashboard
const CLERK_ID = process.argv[2] || "user_YOUR_CLERK_ID";
const EMAIL = process.argv[3] || "your-email@example.com";
const FIRST_NAME = process.argv[4] || "Your";
const LAST_NAME = process.argv[5] || "Name";

async function main() {
  console.log("🔍 Creating User and Student records...\n");
  console.log(`Clerk ID: ${CLERK_ID}`);
  console.log(`Email: ${EMAIL}`);
  console.log(`Name: ${FIRST_NAME} ${LAST_NAME}\n`);

  if (CLERK_ID === "user_YOUR_CLERK_ID") {
    console.log("❌ Please provide your Clerk ID as the first argument:");
    console.log("   npx tsx scripts/create-user-manual.ts user_YOUR_CLERK_ID your@email.com FirstName LastName");
    console.log("\nYou can find your Clerk ID in:");
    console.log("  1. Browser console errors (it shows the userId in the query)");
    console.log("  2. Clerk Dashboard > Users");
    console.log("  3. Network tab > Look for userId parameter");
    return;
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { clerkId: CLERK_ID },
    include: { student: true },
  });

  if (existingUser) {
    console.log(`⚠️  User already exists!`);
    console.log(`   Email: ${existingUser.email}`);
    console.log(`   Has Student: ${!!existingUser.student}`);

    if (!existingUser.student) {
      // Create missing student
      const student = await prisma.student.create({
        data: {
          userId: existingUser.id,
          firstName: FIRST_NAME,
          lastName: LAST_NAME,
          phone: "+1-555-0000",
        },
      });
      console.log(`\n✅ Created Student record!`);
      console.log(`   Student ID: ${student.id}`);
    }

    return;
  }

  // Create both User and Student
  const user = await prisma.user.create({
    data: {
      clerkId: CLERK_ID,
      email: EMAIL,
      emailVerified: true,
      role: "STUDENT",
      student: {
        create: {
          firstName: FIRST_NAME,
          lastName: LAST_NAME,
          phone: "+1-555-0000",
        },
      },
    },
    include: {
      student: true,
    },
  });

  console.log(`✅ Created User and Student records successfully!`);
  console.log(`   User ID: ${user.id}`);
  console.log(`   Student ID: ${user.student?.id}`);
  console.log(`\n💡 Now refresh your browser at http://localhost:3000`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
