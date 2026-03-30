import argon2 from 'argon2'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../../../core/prisma.js'
import { HttpError } from '../../../core/errors/http.js'

declare module 'fastify' {
  interface FastifyRequest {
    apiKeyUserId?: string
  }
}

export async function hasApiKey(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization

  if (!header?.startsWith('ApiKey ')) {
    return reply.code(401).send(HttpError.unauthorized('API key required'))
  }

  const key = header.slice(7)
  const prefix = key.slice(0, 8)

  const apiKey = await prisma.apiKey.findFirst({
    where: {
      prefix,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  })

  if (!apiKey) {
    return reply.code(401).send(HttpError.unauthorized('Invalid API key'))
  }

  const valid = await argon2.verify(apiKey.keyHash, key)
  if (!valid) {
    return reply.code(401).send(HttpError.unauthorized('Invalid API key'))
  }

  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  })

  request.apiKeyUserId = apiKey.userId
}
