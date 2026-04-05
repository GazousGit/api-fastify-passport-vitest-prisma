import { prisma } from '../../../core/prisma.js'
import { NotFound, BadRequest } from '../../../core/errors/index.js'
import type { ApiKey } from '../type.js'

export async function revokeApiKey(id: string, userId: string): Promise<ApiKey> {
  const apiKey = await prisma.apiKey.findFirst({ where: { id, userId } })

  if (!apiKey) {
    throw new NotFound('API key not found')
  }

  if (apiKey.revokedAt) {
    throw new BadRequest('API key is already revoked')
  }

  const updated = await prisma.apiKey.update({
    where: { id },
    data: { revokedAt: new Date() },
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { keyHash: _keyHash, ...safeApiKey } = updated

  return safeApiKey
}
