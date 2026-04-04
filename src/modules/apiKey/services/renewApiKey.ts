import { randomBytes } from 'node:crypto'
import argon2 from 'argon2'
import { prisma } from '../../../core/prisma.js'
import type { ApiKeyWithSecret } from '../type.js'

export async function renewApiKey(id: string, userId: string): Promise<ApiKeyWithSecret> {
  const apiKey = await prisma.apiKey.findFirst({ where: { id, userId } })

  if (!apiKey) {
    throw Object.assign(new Error('API key not found'), { statusCode: 404 })
  }

  const rawKey = randomBytes(32).toString('hex')
  const prefix = rawKey.slice(0, 8)
  const keyHash = await argon2.hash(rawKey)

  const updated = await prisma.apiKey.update({
    where: { id },
    data: { prefix, keyHash, revokedAt: null, lastUsedAt: null },
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { keyHash: _keyHash, ...safeApiKey } = updated

  return { ...safeApiKey, key: rawKey }
}
