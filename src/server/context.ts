import { auth } from '@clerk/nextjs/server'
import { prisma } from './db'

export async function createContext() {
  const { userId } = await auth()

  return {
    prisma,
    userId: userId ?? null,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
