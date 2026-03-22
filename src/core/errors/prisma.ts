import { Prisma } from '@prisma/client'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { HttpError } from './http.js'

// Maps Prisma error codes to HTTP responses.
// Full code reference: https://www.prisma.io/docs/reference/api-reference/error-reference
const PRISMA_ERROR_MAP: Record<string, { statusCode: number; message: string }> = {
  // Constraint violations
  P2002: { statusCode: 409, message: 'A record with that value already exists.' },
  P2003: { statusCode: 409, message: 'Operation violates a foreign key constraint.' },
  P2004: { statusCode: 409, message: 'A database constraint failed.' },

  // Not found
  P2025: { statusCode: 404, message: 'Record not found.' },
  P2015: { statusCode: 404, message: 'Related record not found.' },
  P2018: { statusCode: 404, message: 'Required connected record not found.' },

  // Bad input
  P2000: { statusCode: 400, message: 'Input value is too long for the column.' },
  P2005: { statusCode: 400, message: 'Invalid value stored in the database.' },
  P2006: { statusCode: 400, message: 'Invalid value provided for a field.' },
  P2007: { statusCode: 400, message: 'Data validation error.' },
  P2011: { statusCode: 400, message: 'Null constraint violation on a required field.' },
  P2012: { statusCode: 400, message: 'Missing a required value.' },
  P2013: { statusCode: 400, message: 'Missing a required argument.' },
}

export function handlePrismaError(
  error: unknown,
  request: FastifyRequest,
  reply: FastifyReply,
): FastifyReply {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = PRISMA_ERROR_MAP[error.code]
    if (mapped) {
      return reply.code(mapped.statusCode).send({
        statusCode: mapped.statusCode,
        error: error.code,
        message: mapped.message,
      })
    }
    // Known code but not mapped — log and return 500
    request.log.error({ prismaCode: error.code, meta: error.meta }, 'Unmapped Prisma error')
    return reply.code(500).send(HttpError.internal())
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return reply.code(400).send(HttpError.badRequest('Invalid data shape sent to the database.'))
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    request.log.error(error, 'Unknown Prisma request error')
    return reply.code(500).send(HttpError.internal('A database error occurred.'))
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    request.log.error(error, 'Prisma failed to connect to the database')
    return reply.code(503).send(toErrorResponse(503, 'Service Unavailable', 'Database unavailable.'))
  }

  return reply.code(500).send(HttpError.internal())
}

// Re-export for convenience so callers only import from this file
function toErrorResponse(statusCode: number, error: string, message: string) {
  return { statusCode, error, message }
}

export function isPrismaError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientValidationError ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  )
}
