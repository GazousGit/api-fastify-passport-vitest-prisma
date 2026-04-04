import '@fastify/swagger'
import type { FastifyPluginAsync } from 'fastify'
import type { CreateApiKeyBody, ApiKeyIdParam } from '../../modules/apiKey/type.js'
import type { User } from '../../modules/user/type.js'
import { createApiKey } from '../../modules/apiKey/services/createApiKey.js'
import { revokeApiKey } from '../../modules/apiKey/services/revokeApiKey.js'
import { deleteApiKey } from '../../modules/apiKey/services/deleteApiKey.js'
import { renewApiKey } from '../../modules/apiKey/services/renewApiKey.js'
import { apiKeyCreate } from '../../modules/apiKey/middlewares/apiKeyCreate.js'
import { apiKeyIdParam } from '../../modules/apiKey/middlewares/apiKeyIdParam.js'
import { isAuthenticated } from '../../modules/auth/hooks/isAuthenticated.js'
import { isAdmin } from '../../modules/auth/hooks/isAdmin.js'

const apiKeySchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    userId: { type: 'string' },
    name: { type: 'string' },
    prefix: { type: 'string' },
    scopes: { type: 'array', items: { type: 'string' } },
    expiresAt: { type: 'string', format: 'date-time', nullable: true },
    lastUsedAt: { type: 'string', format: 'date-time', nullable: true },
    revokedAt: { type: 'string', format: 'date-time', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'userId', 'name', 'prefix', 'scopes', 'createdAt'],
} as const

const apiKeyWithSecretSchema = {
  type: 'object',
  properties: {
    ...apiKeySchema.properties,
    key: { type: 'string', description: 'Plaintext key — shown only once' },
  },
  required: [...apiKeySchema.required, 'key'],
} as const

const errorSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'number' },
    error: { type: 'string' },
    message: { type: 'string' },
  },
} as const

const idParamSchema = {
  type: 'object',
  properties: { id: { type: 'string', minLength: 1 } },
  required: ['id'],
} as const

const apiKeyRoutes: FastifyPluginAsync = async (app): Promise<void> => {
  // POST /api-keys
  app.post<{ Body: CreateApiKeyBody }>('/', {
    schema: {
      tags: ['api-keys'],
      summary: 'Create an API key',
      security: [{ cookieAuth: [] }],
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          scopes: { type: 'array', items: { type: 'string' } },
          expiresAt: { type: 'string', format: 'date-time' },
        },
      },
      response: {
        201: apiKeyWithSecretSchema,
        400: errorSchema,
        401: errorSchema,
      },
    },
    preHandler: [isAuthenticated, apiKeyCreate],
  }, async (request, reply) => {
    const userId = (request.user as User).id
    const result = await createApiKey({ userId, ...request.body })
    return reply.code(201).send(result)
  })

  // DELETE /api-keys/:id
  app.delete<{ Params: ApiKeyIdParam }>('/:id', {
    schema: {
      tags: ['api-keys'],
      summary: 'Delete an API key',
      description: 'Requires Admin role.',
      security: [{ cookieAuth: [] }],
      params: idParamSchema,
      response: {
        204: { type: 'null', description: 'No content' },
        400: errorSchema,
        401: errorSchema,
        403: errorSchema,
        404: errorSchema,
      },
    },
    preHandler: [isAdmin, apiKeyIdParam],
  }, async (request, reply) => {
    const userId = (request.user as User).id
    await deleteApiKey(request.params.id, userId)
    return reply.code(204).send()
  })

  // POST /api-keys/:id/revoke
  app.post<{ Params: ApiKeyIdParam }>('/:id/revoke', {
    schema: {
      tags: ['api-keys'],
      summary: 'Revoke an API key',
      description: 'Requires Admin role.',
      security: [{ cookieAuth: [] }],
      params: idParamSchema,
      response: {
        200: apiKeySchema,
        400: errorSchema,
        401: errorSchema,
        403: errorSchema,
        404: errorSchema,
      },
    },
    preHandler: [isAdmin, apiKeyIdParam],
  }, async (request) => {
    const userId = (request.user as User).id
    return revokeApiKey(request.params.id, userId)
  })

  // POST /api-keys/:id/renew
  app.post<{ Params: ApiKeyIdParam }>('/:id/renew', {
    schema: {
      tags: ['api-keys'],
      summary: 'Renew an API key — generates a new secret',
      description: 'Requires Admin role.',
      security: [{ cookieAuth: [] }],
      params: idParamSchema,
      response: {
        200: apiKeyWithSecretSchema,
        400: errorSchema,
        401: errorSchema,
        403: errorSchema,
        404: errorSchema,
      },
    },
    preHandler: [isAdmin, apiKeyIdParam],
  }, async (request) => {
    const userId = (request.user as User).id
    return renewApiKey(request.params.id, userId)
  })
}

export default apiKeyRoutes
