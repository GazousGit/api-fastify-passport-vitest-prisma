import { randomBytes } from 'node:crypto'
import argon2 from 'argon2'
import { prisma } from '../../../core/prisma.js'
import type { ApiKeyWithSecret, CreateApiKeyInput } from '../type.js'

export async function createApiKey(input: CreateApiKeyInput): Promise<ApiKeyWithSecret> {
  const rawKey = randomBytes(32).toString('hex')
  const prefix = rawKey.slice(0, 8)
  const keyHash = await argon2.hash(rawKey)

  const apiKey = await prisma.apiKey.create({
    data: {
      userId: input.userId,
      name: input.name,
      prefix,
      keyHash,
      scopes: input.scopes ?? [],
      expiresAt: input.expiresAt ?? null,
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { keyHash: _keyHash, ...safeApiKey } = apiKey

  return { ...safeApiKey, key: rawKey }
}
