import type { FastifyRequest, FastifyReply } from 'fastify'
import type { User } from '../../user/type.js'
import { HttpError } from '../../../core/errors/http.js'

export async function isAdmin(request: FastifyRequest, reply: FastifyReply) {
  if (!request.isAuthenticated()) {
    return reply.code(401).send(HttpError.unauthorized('Authentication required'))
  }

  if ((request.user as User).role !== 'Admin') {
    return reply.code(403).send(HttpError.forbidden('Admin access required'))
  }
}
