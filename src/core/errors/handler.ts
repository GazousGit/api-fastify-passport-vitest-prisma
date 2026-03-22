import fp from 'fastify-plugin'
import type { FastifyError } from 'fastify'
import { isPrismaError, handlePrismaError } from './prisma.js'
import { HttpError } from './http.js'

function hasStatusCode(error: Error): error is Error & { statusCode: number } {
  return 'statusCode' in error && typeof (error as Record<string, unknown>).statusCode === 'number'
}

function hasValidation(
  error: Error,
): error is FastifyError & { validation: NonNullable<FastifyError['validation']> } {
  return 'validation' in error && Array.isArray((error as Record<string, unknown>).validation)
}

export default fp(async (app) => {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    // 1. Prisma errors
    if (isPrismaError(error)) {
      return handlePrismaError(error, request, reply)
    }

    // 2. Fastify validation errors
    if (hasValidation(error)) {
      return reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: error.message,
        validation: error.validation,
      })
    }

    // 3. Known HTTP errors (thrown by @fastify/sensible or reply.httpErrors.*)
    if (hasStatusCode(error)) {
      // 400+ errors are client mistakes — not logged
      if (error.statusCode < 500) {
        return reply.code(error.statusCode).send({
          statusCode: error.statusCode,
          error: error.name,
          message: error.message,
        })
      }

      // 500+ errors should be logged
      request.log.error({ err: error }, error.message)
      return reply.code(error.statusCode).send({
        statusCode: error.statusCode,
        error: error.name,
        message: error.message,
      })
    }

    // 4. Anything else is an unexpected server error — log the full error
    request.log.error({ err: error }, 'Unhandled error')
    return reply.code(500).send(HttpError.internal())
  })
})
