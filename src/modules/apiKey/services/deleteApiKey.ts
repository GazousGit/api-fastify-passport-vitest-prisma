import { prisma } from '../../../core/prisma.js'
import { NotFound } from '../../../core/errors/index.js'

export async function deleteApiKey(id: string, userId: string): Promise<void> {
  const apiKey = await prisma.apiKey.findFirst({ where: { id, userId } })

  if (!apiKey) {
    throw new NotFound('API key not found')
  }

  await prisma.apiKey.delete({ where: { id } })
}
