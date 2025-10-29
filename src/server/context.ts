import { auth } from '@clerk/nextjs/server'
import { prisma } from './db'

export async function createContext() {
  const { userId: clerkUserId } = await auth()

  // If user is authenticated, get the database User ID
  let dbUserId: string | null = null
  if (clerkUserId) {
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    })
    dbUserId = user?.id ?? null
  }

  return {
    prisma,
    userId: dbUserId, // This is now the database User.id, not Clerk ID
    clerkId: clerkUserId ?? null, // Keep Clerk ID available if needed
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
