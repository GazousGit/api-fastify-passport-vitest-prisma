import { prisma } from '../../../core/prisma.js'
import type { User, CreateUserInput } from '../type.js'

export async function createUser(data: CreateUserInput): Promise<User> {
  return prisma.user.create({ data })
}
