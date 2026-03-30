import type { FastifyRequest, FastifyReply } from 'fastify'
import { HttpError } from '../../../core/errors/http.js'

export async function isAuthenticated(request: FastifyRequest, reply: FastifyReply) {
  if (!request.isAuthenticated()) {
    return reply.code(401).send(HttpError.unauthorized('Authentication required'))
  }
}
