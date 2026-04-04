import type { z } from 'zod'
import type { createApiKeyBodySchema, apiKeyIdParamSchema } from './model.js'

export interface ApiKey {
  id: string
  userId: string
  name: string
  prefix: string
  scopes: string[]
  expiresAt: Date | null
  lastUsedAt: Date | null
  revokedAt: Date | null
  createdAt: Date
}

export interface ApiKeyWithSecret extends ApiKey {
  key: string
}

export interface CreateApiKeyInput {
  userId: string
  name: string
  scopes?: string[]
  expiresAt?: Date
}

export type CreateApiKeyBody = z.infer<typeof createApiKeyBodySchema>
export type ApiKeyIdParam = z.infer<typeof apiKeyIdParamSchema>
