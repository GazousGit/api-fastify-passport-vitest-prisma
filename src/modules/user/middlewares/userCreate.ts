import type { FastifyRequest, FastifyReply } from 'fastify'
import { createUserSchema } from '../model.js'

export async function userCreate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const result = createUserSchema.safeParse(request.body)
  if (!result.success) {
    return reply.code(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      validation: result.error.issues,
    })
  }
}
