import type { FastifyPluginAsync } from 'fastify'
import type { RegisterInput } from '../../modules/auth/type.js'
import { register } from '../../modules/auth/services/register.js'
import { login } from '../../modules/auth/services/login.js'

const errorSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'number' },
    error: { type: 'string' },
    message: { type: 'string' },
  },
} as const

const localAuthRoutes: FastifyPluginAsync = async (app) => {
  // POST /auth/register
  app.post<{ Body: RegisterInput }>(
    '/register',
    {
      config: { rateLimit: { max: 10, timeWindow: 60_000 } },
      schema: {
        tags: ['auth'],
        summary: 'Register with email and password',
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            firstName: { type: 'string', minLength: 1, maxLength: 100 },
            lastName: { type: 'string', minLength: 1, maxLength: 100 },
          },
        },
        response: {
          201: { type: 'object', properties: { id: { type: 'string' }, email: { type: 'string' } } },
          409: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const user = await register(request.body)
      await request.logIn(user)
      return reply.code(201).send({ id: user.id, email: user.email })
    },
  )

  // POST /auth/login
  app.post<{ Body: { email: string; password: string } }>(
    '/login',
    {
      config: { rateLimit: { max: 10, timeWindow: 60_000 } },
      schema: {
        tags: ['auth'],
        summary: 'Login with email and password',
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        response: {
          200: { type: 'object', properties: { id: { type: 'string' }, email: { type: 'string' } } },
          401: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const user = await login(request.body.email, request.body.password)

      if (!user) {
        return reply.code(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Invalid email or password' })
      }

      await request.logIn(user)
      return reply.send({ id: user.id, email: user.email })
    },
  )

  // POST /auth/logout
  app.post(
    '/logout',
    {
      schema: {
        tags: ['auth'],
        summary: 'Logout current session',
        response: { 204: { type: 'null' } },
      },
    },
    async (request, reply) => {
      await request.logOut()
      return reply.code(204).send()
    },
  )
}

export default localAuthRoutes
