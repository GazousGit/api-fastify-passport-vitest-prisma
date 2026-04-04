import { z } from 'zod'

export const apiKeyIdParamSchema = z.object({
  id: z.string().min(1, 'API key ID is required'),
})

export const createApiKeyBodySchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.string()).optional(),
  expiresAt: z.coerce.date().optional(),
})
