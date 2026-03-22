import { prisma } from '../../../core/prisma.js'
import type { User, UpdateUserInput } from '../type.js'

export async function updateUser(id: string, data: UpdateUserInput): Promise<User> {
  return prisma.user.update({ where: { id }, data })
}
