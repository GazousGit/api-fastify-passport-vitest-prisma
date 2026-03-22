import type { FastifyRequest, FastifyReply } from 'fastify'
import { userIdParamSchema, patchUserSchema } from '../model.js'

export async function userPatch(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const paramsResult = userIdParamSchema.safeParse(request.params)
  if (!paramsResult.success) {
    return reply.code(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      validation: paramsResult.error.issues,
    })
  }

  const bodyResult = patchUserSchema.safeParse(request.body)
  if (!bodyResult.success) {
    return reply.code(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      validation: bodyResult.error.issues,
    })
  }
}
