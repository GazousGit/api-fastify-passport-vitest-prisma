import { prisma } from '../../../core/prisma.js'
import type { User } from '../type.js'

export async function getUserById(id: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    throw Object.assign(new Error(`User with id '${id}' not found`), { statusCode: 404 })
  }
  return user
}
