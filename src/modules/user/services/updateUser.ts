import { prisma } from '../../../core/prisma.js'
import type { User, UpdateUserInput } from '../type.js'

export async function updateUser(id: string, data: UpdateUserInput): Promise<User> {
  return prisma.user.update({
    where: { id },
    data: {
      email: data.email,
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
      userName: data.userName ?? null,
      mobilePhone: data.mobilePhone ?? null,
    },
  })
}
