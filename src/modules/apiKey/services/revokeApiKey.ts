import { prisma } from '../../../core/prisma.js'
import type { ApiKey } from '../type.js'

export async function revokeApiKey(id: string, userId: string): Promise<ApiKey> {
  const apiKey = await prisma.apiKey.findFirst({ where: { id, userId } })

  if (!apiKey) {
    throw Object.assign(new Error('API key not found'), { statusCode: 404 })
  }

  if (apiKey.revokedAt) {
    throw Object.assign(new Error('API key is already revoked'), { statusCode: 400 })
  }

  const updated = await prisma.apiKey.update({
    where: { id },
    data: { revokedAt: new Date() },
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { keyHash: _keyHash, ...safeApiKey } = updated

  return safeApiKey
}
