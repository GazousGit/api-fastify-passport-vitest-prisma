import { prisma } from '../../../core/prisma.js'

export async function deleteUser(id: string): Promise<void> {
  await prisma.user.delete({ where: { id } })
}
