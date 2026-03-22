import { prisma } from '../../../core/prisma.js'
import type { User, PatchUserInput } from '../type.js'

export async function patchUser(id: string, data: PatchUserInput): Promise<User> {
  return prisma.user.update({ where: { id }, data })
}
