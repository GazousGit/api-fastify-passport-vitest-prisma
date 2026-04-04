import type { FastifyRequest, FastifyReply } from 'fastify'
import { apiKeyIdParamSchema } from '../model.js'

export async function apiKeyIdParam(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const result = apiKeyIdParamSchema.safeParse(request.params)
  if (!result.success) {
    return reply.code(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      validation: result.error.issues,
    })
  }
}
