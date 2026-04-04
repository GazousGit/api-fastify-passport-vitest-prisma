import { prisma } from '../../../core/prisma.js'

export async function deleteApiKey(id: string, userId: string): Promise<void> {
  const apiKey = await prisma.apiKey.findFirst({ where: { id, userId } })

  if (!apiKey) {
    throw Object.assign(new Error('API key not found'), { statusCode: 404 })
  }

  await prisma.apiKey.delete({ where: { id } })
}
