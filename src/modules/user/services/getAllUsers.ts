import { prisma } from '../../../core/prisma.js'
import type { User } from '../type.js'

export async function getAllUsers(): Promise<User[]> {
  return prisma.user.findMany()
}
