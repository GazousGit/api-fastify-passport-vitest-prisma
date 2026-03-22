import '@fastify/swagger'
import type { FastifyPluginAsync } from 'fastify'
import type { CreateUserInput, UpdateUserInput, PatchUserInput, UserIdParam } from '../../modules/user/type.js'
import { createUser } from '../../modules/user/services/createUser.js'
import { getAllUsers } from '../../modules/user/services/getAllUsers.js'
import { getUserById } from '../../modules/user/services/getUserById.js'
import { updateUser } from '../../modules/user/services/updateUser.js'
import { patchUser } from '../../modules/user/services/patchUser.js'
import { deleteUser } from '../../modules/user/services/deleteUser.js'
import { userCreate } from '../../modules/user/middlewares/userCreate.js'
import { userGetById } from '../../modules/user/middlewares/userGetById.js'
import { userUpdate } from '../../modules/user/middlewares/userUpdate.js'
import { userPatch } from '../../modules/user/middlewares/userPatch.js'
import { userDelete } from '../../modules/user/middlewares/userDelete.js'

const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    email: { type: 'string', format: 'email' },
    firstName: { type: 'string', nullable: true },
    lastName: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'email', 'createdAt', 'updatedAt'],
} as const

const errorSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'number' },
    error: { type: 'string' },
    message: { type: 'string' },
  },
} as const

const idParamSchema = {
  type: 'object',
  properties: { id: { type: 'string', minLength: 1 } },
  required: ['id'],
} as const


const userRoutes: FastifyPluginAsync = async (app): Promise<void> => {
  // GET /users
  app.get('/', {
    schema: {
      tags: ['users'],
      summary: 'Get all users',
      response: {
        200: { type: 'array', items: userSchema },
      },
    },
  }, async () => {
    return getAllUsers()
  })

  // GET /users/:id
  app.get<{ Params: UserIdParam }>('/:id', {
    schema: {
      tags: ['users'],
      summary: 'Get user by ID',
      params: idParamSchema,
      response: {
        200: userSchema,
        400: errorSchema,
        404: errorSchema,
      },
    },
    preHandler: [userGetById],
  }, async (request) => {
    return getUserById(request.params.id)
  })

  // POST /users
  app.post<{ Body: CreateUserInput }>('/', {
    schema: {
      tags: ['users'],
      summary: 'Create a user',
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string', minLength: 1, maxLength: 100 },
          lastName: { type: 'string', minLength: 1, maxLength: 100 },
        },
      },
      response: {
        201: userSchema,
        400: errorSchema,
        409: errorSchema,
      },
    },
    preHandler: [userCreate],
  }, async (request, reply) => {
    const user = await createUser(request.body)
    return reply.code(201).send(user)
  })

  // PUT /users/:id
  app.put<{ Params: UserIdParam; Body: UpdateUserInput }>('/:id', {
    schema: {
      tags: ['users'],
      summary: 'Replace a user',
      params: idParamSchema,
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string', minLength: 1, maxLength: 100, nullable: true },
          lastName: { type: 'string', minLength: 1, maxLength: 100, nullable: true },
        },
      },
      response: {
        200: userSchema,
        400: errorSchema,
        404: errorSchema,
      },
    },
    preHandler: [userUpdate],
  }, async (request) => {
    return updateUser(request.params.id, request.body)
  })

  // PATCH /users/:id
  app.patch<{ Params: UserIdParam; Body: PatchUserInput }>('/:id', {
    schema: {
      tags: ['users'],
      summary: 'Partially update a user',
      params: idParamSchema,
      body: {
        type: 'object',
        minProperties: 1,
        properties: {
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string', minLength: 1, maxLength: 100, nullable: true },
          lastName: { type: 'string', minLength: 1, maxLength: 100, nullable: true },
        },
      },
      response: {
        200: userSchema,
        400: errorSchema,
        404: errorSchema,
      },
    },
    preHandler: [userPatch],
  }, async (request) => {
    return patchUser(request.params.id, request.body)
  })

  // DELETE /users/:id
  app.delete<{ Params: UserIdParam }>('/:id', {
    schema: {
      tags: ['users'],
      summary: 'Delete a user',
      params: idParamSchema,
      response: {
        204: { type: 'null', description: 'No content' },
        404: errorSchema,
      },
    },
    preHandler: [userDelete],
  }, async (request, reply) => {
    await deleteUser(request.params.id)
    return reply.code(204).send()
  })
}

export default userRoutes
