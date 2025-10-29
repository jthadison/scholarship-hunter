import { PrismaClient } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking Clerk and Database sync...\n");

  // Get current Clerk user (assumes you're logged in)
  const clerk = await clerkClient();
  const clerkUsers = await clerk.users.getUserList();

  console.log(`Found ${clerkUsers.totalCount} Clerk user(s)`);

  if (clerkUsers.totalCount === 0) {
    console.log("❌ No Clerk users found. Please sign up first.");
    return;
  }

  // Check database
  const dbUsers = await prisma.user.findMany({
    include: {
      student: true,
    },
  });

  console.log(`Found ${dbUsers.length} database user(s)\n`);

  // Sync Clerk users to database
  for (const clerkUser of clerkUsers.data) {
    const primaryEmail = clerkUser.emailAddresses.find(
      (email) => email.id === clerkUser.primaryEmailAddressId
    );

    if (!primaryEmail) {
      console.log(`⚠️  Skipping ${clerkUser.id} - no primary email`);
      continue;
    }

    // Check if user exists in database
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      include: { student: true },
    });

    if (existingUser) {
      if (existingUser.student) {
        console.log(`✅ ${primaryEmail.emailAddress} - already synced`);
      } else {
        // Create missing student
        const student = await prisma.student.create({
          data: {
            userId: existingUser.id,
            firstName: clerkUser.firstName || primaryEmail.emailAddress.split("@")[0] || "User",
            lastName: clerkUser.lastName || "Student",
            phone: "+1-555-0000",
          },
        });
        console.log(`✅ ${primaryEmail.emailAddress} - created Student record`);
      }
    } else {
      // Create both User and Student
      const user = await prisma.user.create({
        data: {
          clerkId: clerkUser.id,
          email: primaryEmail.emailAddress,
          emailVerified: primaryEmail.verification?.status === "verified",
          role: "STUDENT",
          student: {
            create: {
              firstName: clerkUser.firstName || primaryEmail.emailAddress.split("@")[0] || "User",
              lastName: clerkUser.lastName || "Student",
              phone: "+1-555-0000",
            },
          },
        },
        include: {
          student: true,
        },
      });

      console.log(`✅ ${primaryEmail.emailAddress} - created User and Student records`);
      console.log(`   User ID: ${user.id}`);
      console.log(`   Student ID: ${user.student?.id}`);
    }
  }

  console.log("\n✨ Sync complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
