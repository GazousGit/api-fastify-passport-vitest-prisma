import type { FastifyRequest, FastifyReply } from 'fastify'
import { createApiKeyBodySchema } from '../model.js'

export async function apiKeyCreate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const result = createApiKeyBodySchema.safeParse(request.body)
  if (!result.success) {
    return reply.code(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      validation: result.error.issues,
    })
  }
}
