import argon2 from 'argon2'
import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../core/prisma.js'

const checkApiKeyResponseSchema = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['valid', 'expired', 'revoked', 'invalid', 'missing'] },
    message: { type: 'string' },
  },
  required: ['status', 'message'],
} as const

const rootRoutes: FastifyPluginAsync = async (app): Promise<void> => {
  app.get('/health', async function () {
    return { status: 'ok' }
  })

  app.get('/checkApiKey', {
    schema: {
      tags: ['auth'],
      summary: 'Check the status of an API key',
      description: 'Reads the Authorization: ApiKey <key> header and reports whether the key is valid, expired, revoked, or invalid.',
      security: [{ apiKeyAuth: [] }],
      response: {
        200: checkApiKeyResponseSchema,
      },
    },
  }, async (request) => {
    const header = request.headers.authorization

    if (!header?.startsWith('ApiKey ')) {
      return { status: 'missing', message: 'API key required' }
    }

    const key = header.slice(7)
    const prefix = key.slice(0, 8)

    // Find by prefix only — do NOT filter on revokedAt/expiresAt so we can report the exact state
    const apiKey = await prisma.apiKey.findFirst({ where: { prefix } })

    if (!apiKey) {
      return { status: 'invalid', message: 'API key is invalid' }
    }

    // Verify hash before revealing any state — prevents probing revoked/expired status with a wrong key
    const valid = await argon2.verify(apiKey.keyHash, key)
    if (!valid) {
      return { status: 'invalid', message: 'API key is invalid' }
    }

    if (apiKey.revokedAt) {
      return { status: 'revoked', message: 'API key has been revoked' }
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return { status: 'expired', message: 'API key has expired' }
    }

    return { status: 'valid', message: 'API key authentication successful' }
  })
}

export default rootRoutes
