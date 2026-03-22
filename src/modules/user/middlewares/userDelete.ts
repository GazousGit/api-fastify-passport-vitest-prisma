import type { FastifyRequest, FastifyReply } from 'fastify'
import { userIdParamSchema } from '../model.js'

export async function userDelete(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const result = userIdParamSchema.safeParse(request.params)
  if (!result.success) {
    return reply.code(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      validation: result.error.issues,
    })
  }
}
