import { vi, describe, it, expect, beforeEach, onTestFinished } from 'vitest'
import Fastify from 'fastify'
import request from 'supertest'
import userRoutes from './index.js'

vi.mock('../../modules/user/services/createUser.js')
vi.mock('../../modules/user/services/getAllUsers.js')
vi.mock('../../modules/user/services/getUserById.js')
vi.mock('../../modules/user/services/updateUser.js')
vi.mock('../../modules/user/services/patchUser.js')
vi.mock('../../modules/user/services/deleteUser.js')

import { createUser } from '../../modules/user/services/createUser.js'
import { getAllUsers } from '../../modules/user/services/getAllUsers.js'
import { getUserById } from '../../modules/user/services/getUserById.js'
import { updateUser } from '../../modules/user/services/updateUser.js'
import { patchUser } from '../../modules/user/services/patchUser.js'
import { deleteUser } from '../../modules/user/services/deleteUser.js'

const mockUser = {
  id: 'cuid-1',
  email: 'alice@example.com',
  firstName: 'Alice',
  lastName: 'Smith',
  userName: null,
  mobilePhone: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

async function setup() {
  const app = Fastify({ logger: false })
  await app.register(userRoutes)
  await app.ready()
  onTestFinished(() => app.close())
  return request(app.server)
}

beforeEach(() => vi.clearAllMocks())

describe('routes -> user -> ', () => {
  describe('GET /', () => {
    it('should returns all users with 200', async () => {
      vi.mocked(getAllUsers).mockResolvedValue([mockUser])
      const api = await setup()

      const res = await api.get('/')

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject([{ email: 'alice@example.com' }])
      expect(getAllUsers).toHaveBeenCalled()
    })

    it('should returns an empty array when there are no users', async () => {
      vi.mocked(getAllUsers).mockResolvedValue([])
      const api = await setup()

      const res = await api.get('/')

      expect(res.status).toBe(200)
      expect(res.body).toEqual([])
    })
  })

  describe('GET /:id', () => {
    it('should returns the user with 200', async () => {
      vi.mocked(getUserById).mockResolvedValue(mockUser)
      const api = await setup()

      const res = await api.get('/cuid-1')

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({ id: 'cuid-1', email: 'alice@example.com' })
    })

    it('should throw 404 when the service throws a not-found error', async () => {
      vi.mocked(getUserById).mockRejectedValue(
        Object.assign(new Error('not found'), { statusCode: 404 }),
      )
      const api = await setup()

      const res = await api.get('/unknown')

      expect(res.status).toBe(404)
      expect(getUserById).toHaveBeenCalledWith('unknown')
    })
  })

  describe('POST /', () => {
    it('should creates a user and returns 201', async () => {
      vi.mocked(createUser).mockResolvedValue(mockUser)
      const api = await setup()

      const res = await api
        .post('/')
        .send({ email: 'alice@example.com', firstName: 'Alice', lastName: 'Smith' })

      expect(res.status).toBe(201)
      expect(res.body).toMatchObject({ email: 'alice@example.com' })
      expect(createUser).toHaveBeenCalledWith({
        email: 'alice@example.com',
        firstName: 'Alice',
        lastName: 'Smith',
      })
    })

    it('should throw 400 for an invalid email', async () => {
      const api = await setup()

      const res = await api.post('/').send({ email: 'not-an-email' })

      expect(res.status).toBe(400)
      expect(createUser).not.toHaveBeenCalled()
    })

    it('should throw 400 when email is missing', async () => {
      const api = await setup()

      const res = await api.post('/').send({})

      expect(res.status).toBe(400)
      expect(createUser).not.toHaveBeenCalled()
    })
  })

  describe('PUT /:id', () => {
    it('should replaces the user and returns 200', async () => {
      const updated = { ...mockUser, firstName: 'Updated' }
      vi.mocked(updateUser).mockResolvedValue(updated)
      const api = await setup()

      const res = await api
        .put('/cuid-1')
        .send({ email: 'alice@example.com', firstName: 'Updated' })

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({ firstName: 'Updated' })
      expect(updateUser).toHaveBeenCalledWith('cuid-1', {
        email: 'alice@example.com',
        firstName: 'Updated',
      })
    })

    it('should throw 400 when email is missing', async () => {
      const api = await setup()

      const res = await api.put('/cuid-1').send({ name: 'Updated' })

      expect(res.status).toBe(400)
      expect(updateUser).not.toHaveBeenCalled()
    })

    it('should throw 400 for an invalid email', async () => {
      const api = await setup()

      const res = await api.put('/cuid-1').send({ email: 'bad' })

      expect(res.status).toBe(400)
      expect(updateUser).not.toHaveBeenCalled()
    })
  })

  describe('PATCH /:id', () => {
    it('should partially updates the user and returns 200', async () => {
      const patched = { ...mockUser, firstName: 'Patched' }
      vi.mocked(patchUser).mockResolvedValue(patched)
      const api = await setup()

      const res = await api.patch('/cuid-1').send({ firstName: 'Patched' })

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({ firstName: 'Patched' })
      expect(patchUser).toHaveBeenCalledWith('cuid-1', { firstName: 'Patched' })
    })

    it('should throw 400 for an empty body', async () => {
      const api = await setup()

      const res = await api.patch('/cuid-1').send({})

      expect(res.status).toBe(400)
      expect(patchUser).not.toHaveBeenCalled()
    })

    it('should throw 400 for an invalid email format', async () => {
      const api = await setup()

      const res = await api.patch('/cuid-1').send({ email: 'bad' })

      expect(res.status).toBe(400)
      expect(patchUser).not.toHaveBeenCalled()
    })
  })

  describe('DELETE /:id', () => {
    it('should deletes the user and returns 204', async () => {
      vi.mocked(deleteUser).mockResolvedValue(undefined)
      const api = await setup()

      const res = await api.delete('/cuid-1')

      expect(res.status).toBe(204)
      expect(deleteUser).toHaveBeenCalledWith('cuid-1')
    })

    it('should throw 400 for an empty id param', async () => {
      vi.mocked(deleteUser).mockResolvedValue(undefined)
      const api = await setup()

      const res = await api.delete('/cuid-1')

      expect(res.status).toBe(204)
    })
  })
})
