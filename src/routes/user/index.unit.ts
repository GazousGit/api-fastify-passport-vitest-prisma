import { vi, describe, it, expect, beforeEach } from 'vitest'
import Fastify from 'fastify'
import { onTestFinished } from 'vitest'
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
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

async function build() {
  const app = Fastify({ logger: false })
  await app.register(userRoutes)
  await app.ready()
  onTestFinished(() => app.close())
  return app
}

beforeEach(() => vi.clearAllMocks())

describe('routes -> user -> ', () => {
  describe('GET /', () => {
    it('should returns all users with 200', async () => {
      vi.mocked(getAllUsers).mockResolvedValue([mockUser])
      const app = await build()

      const res = await app.inject({ method: 'GET', url: '/' })

      expect(res.statusCode).toBe(200)
      expect(res.json()).toMatchObject([{ email: 'alice@example.com' }])
    })

    it('should returns an empty array when there are no users', async () => {
      vi.mocked(getAllUsers).mockResolvedValue([])
      const app = await build()

      const res = await app.inject({ method: 'GET', url: '/' })

      expect(res.statusCode).toBe(200)
      expect(res.json()).toEqual([])
    })
  })

  describe('GET /:id', () => {
    it('should returns the user with 200', async () => {
      vi.mocked(getUserById).mockResolvedValue(mockUser)
      const app = await build()

      const res = await app.inject({ method: 'GET', url: '/cuid-1' })

      expect(res.statusCode).toBe(200)
      expect(res.json()).toMatchObject({ id: 'cuid-1', email: 'alice@example.com' })
    })

    it('should throw 404 when the service throws a not-found error', async () => {
      vi.mocked(getUserById).mockRejectedValue(
        Object.assign(new Error('not found'), { statusCode: 404 }),
      )
      const app = await build()

      const res = await app.inject({ method: 'GET', url: '/unknown' })

      expect(res.statusCode).toBe(404)
      expect(getUserById).toHaveBeenCalledWith('unknown')
    })
  })

  describe('POST /', () => {
    it('should creates a user and returns 201', async () => {
      vi.mocked(createUser).mockResolvedValue(mockUser)
      const app = await build()

      const res = await app.inject({
        method: 'POST',
        url: '/',
        payload: { email: 'alice@example.com', firstName: 'Alice', lastName: 'Smith' },
      })

      expect(res.statusCode).toBe(201)
      expect(res.json()).toMatchObject({ email: 'alice@example.com' })
      expect(createUser).toHaveBeenCalledWith({
        email: 'alice@example.com',
        firstName: 'Alice',
        lastName: 'Smith',
      })
    })

    it('should throw 400 for an invalid email', async () => {
      const app = await build()

      const res = await app.inject({
        method: 'POST',
        url: '/',
        payload: { email: 'not-an-email' },
      })

      expect(res.statusCode).toBe(400)
      expect(createUser).not.toHaveBeenCalled()
    })

    it('should throw 400 when email is missing', async () => {
      const app = await build()

      const res = await app.inject({ method: 'POST', url: '/', payload: {} })

      expect(res.statusCode).toBe(400)
      expect(createUser).not.toHaveBeenCalled()
    })
  })

  describe('PUT /:id', () => {
    it('should replaces the user and returns 200', async () => {
      const updated = { ...mockUser, name: 'Updated' }
      vi.mocked(updateUser).mockResolvedValue(updated)
      const app = await build()

      const res = await app.inject({
        method: 'PUT',
        url: '/cuid-1',
        payload: { email: 'alice@example.com', firstName: 'Updated' },
      })

      expect(res.statusCode).toBe(200)
      expect(res.json()).toMatchObject({ firstName: 'Updated' })
      expect(updateUser).toHaveBeenCalledWith('cuid-1', {
        email: 'alice@example.com',
        firstName: 'Updated',
      })
    })

    it('should throw 400 when email is missing', async () => {
      const app = await build()

      const res = await app.inject({
        method: 'PUT',
        url: '/cuid-1',
        payload: { name: 'Updated' },
      })

      expect(res.statusCode).toBe(400)
      expect(updateUser).not.toHaveBeenCalled()
    })

    it('should throw 400 for an invalid email', async () => {
      const app = await build()

      const res = await app.inject({
        method: 'PUT',
        url: '/cuid-1',
        payload: { email: 'bad' },
      })

      expect(res.statusCode).toBe(400)
      expect(updateUser).not.toHaveBeenCalled()
    })
  })

  describe('PATCH /:id', () => {
    it('should partially updates the user and returns 200', async () => {
      const patched = { ...mockUser, name: 'Patched' }
      vi.mocked(patchUser).mockResolvedValue(patched)
      const app = await build()

      const res = await app.inject({
        method: 'PATCH',
        url: '/cuid-1',
        payload: { firstName: 'Patched' },
      })

      expect(res.statusCode).toBe(200)
      expect(res.json()).toMatchObject({ firstName: 'Patched' })
      expect(patchUser).toHaveBeenCalledWith('cuid-1', { firstName: 'Patched' })
    })

    it('should throw 400 for an empty body', async () => {
      const app = await build()

      const res = await app.inject({ method: 'PATCH', url: '/cuid-1', payload: {} })

      expect(res.statusCode).toBe(400)
      expect(patchUser).not.toHaveBeenCalled()
    })

    it('should throw 400 for an invalid email format', async () => {
      const app = await build()

      const res = await app.inject({
        method: 'PATCH',
        url: '/cuid-1',
        payload: { email: 'bad' },
      })

      expect(res.statusCode).toBe(400)
      expect(patchUser).not.toHaveBeenCalled()
    })
  })

  describe('DELETE /:id', () => {
    it('should deletes the user and returns 204', async () => {
      vi.mocked(deleteUser).mockResolvedValue(undefined)
      const app = await build()

      const res = await app.inject({ method: 'DELETE', url: '/cuid-1' })

      expect(res.statusCode).toBe(204)
      expect(deleteUser).toHaveBeenCalledWith('cuid-1')
    })

    it('should throw 400 for an empty id param', async () => {
      vi.mocked(deleteUser).mockResolvedValue(undefined)
      const app = await build()

      const res = await app.inject({ method: 'DELETE', url: '/cuid-1' })

      expect(res.statusCode).toBe(204)
    })
  })
})
