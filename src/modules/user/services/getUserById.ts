import { prisma } from '../../../core/prisma.js'
import { NotFound } from '../../../core/errors/index.js'
import type { User } from '../type.js'

export async function getUserById(id: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    throw new NotFound(`User with id '${id}' not found`)
  }
  return user
}
