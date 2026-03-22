import type { FastifyRequest, FastifyReply } from 'fastify'
import { userIdParamSchema, updateUserSchema } from '../model.js'

export async function userUpdate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const paramsResult = userIdParamSchema.safeParse(request.params)
  if (!paramsResult.success) {
    return reply.code(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      validation: paramsResult.error.issues,
    })
  }

  const bodyResult = updateUserSchema.safeParse(request.body)
  if (!bodyResult.success) {
    return reply.code(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      validation: bodyResult.error.issues,
    })
  }
}
