import { vi, describe, it, expect, beforeEach, onTestFinished } from 'vitest'
import Fastify from 'fastify'
import request from 'supertest'
import apiKeyRoutes from './index.js'

vi.mock('../../modules/apiKey/services/createApiKey.js')
vi.mock('../../modules/apiKey/services/revokeApiKey.js')
vi.mock('../../modules/apiKey/services/deleteApiKey.js')
vi.mock('../../modules/apiKey/services/renewApiKey.js')

import { createApiKey } from '../../modules/apiKey/services/createApiKey.js'
import { revokeApiKey } from '../../modules/apiKey/services/revokeApiKey.js'
import { deleteApiKey } from '../../modules/apiKey/services/deleteApiKey.js'
import { renewApiKey } from '../../modules/apiKey/services/renewApiKey.js'

const mockAdmin = { id: 'admin-uuid-1', email: 'admin@example.com', role: 'Admin' }
const mockUser = { id: 'user-uuid-1', email: 'alice@example.com', role: 'User' }

const mockApiKey = {
  id: 'key-uuid-1',
  userId: 'user-uuid-1',
  name: 'My Key',
  prefix: 'aaaaaaaa',
  scopes: [],
  expiresAt: null,
  lastUsedAt: null,
  revokedAt: null,
  createdAt: new Date('2024-01-01'),
}

const mockApiKeyWithSecret = { ...mockApiKey, key: 'a'.repeat(64) }

type SetupRole = 'Admin' | 'User' | null

async function setup(role: SetupRole = 'Admin') {
  const app = Fastify({ logger: false })
  const sessionUser = role === 'Admin' ? mockAdmin : role === 'User' ? mockUser : null

  app.decorateRequest('isAuthenticated', function () {
    return sessionUser !== null
  })

  app.addHook('preHandler', (req, _reply, done) => {
    if (sessionUser) {
      ;(req as unknown as { user: typeof sessionUser }).user = sessionUser
    }
    done()
  })

  await app.register(apiKeyRoutes, { prefix: '/api-keys' })
  await app.ready()
  onTestFinished(() => app.close())
  return request(app.server)
}

beforeEach(() => vi.clearAllMocks())

describe('routes -> api-keys', () => {
  describe('POST /api-keys', () => {
    it('should create an api key and return 201 (authenticated user)', async () => {
      vi.mocked(createApiKey).mockResolvedValue(mockApiKeyWithSecret)
      const api = await setup('User')

      const res = await api.post('/api-keys').send({ name: 'My Key' })

      expect(res.status).toBe(201)
      expect(res.body).toMatchObject({ name: 'My Key', key: 'a'.repeat(64) })
      expect(createApiKey).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-uuid-1', name: 'My Key' }),
      )
    })

    it('should create an api key and return 201 (admin)', async () => {
      vi.mocked(createApiKey).mockResolvedValue({ ...mockApiKeyWithSecret, userId: 'admin-uuid-1' })
      const api = await setup('Admin')

      const res = await api.post('/api-keys').send({ name: 'Admin Key' })

      expect(res.status).toBe(201)
    })

    it('should return 400 when name is missing', async () => {
      const api = await setup('User')

      const res = await api.post('/api-keys').send({ scopes: ['read'] })

      expect(res.status).toBe(400)
      expect(createApiKey).not.toHaveBeenCalled()
    })

    it('should return 401 when not authenticated', async () => {
      const api = await setup(null)

      const res = await api.post('/api-keys').send({ name: 'My Key' })

      expect(res.status).toBe(401)
      expect(createApiKey).not.toHaveBeenCalled()
    })

    it('should propagate errors thrown by the service', async () => {
      vi.mocked(createApiKey).mockRejectedValue(
        Object.assign(new Error('Unexpected error'), { statusCode: 500 }),
      )
      const api = await setup('User')

      const res = await api.post('/api-keys').send({ name: 'My Key' })

      expect(res.status).toBe(500)
    })
  })

  describe('DELETE /api-keys/:id', () => {
    it('should delete an api key and return 204 (admin)', async () => {
      vi.mocked(deleteApiKey).mockResolvedValue(undefined)
      const api = await setup('Admin')

      const res = await api.delete('/api-keys/key-uuid-1')

      expect(res.status).toBe(204)
      expect(deleteApiKey).toHaveBeenCalledWith('key-uuid-1', 'admin-uuid-1')
    })

    it('should return 401 when not authenticated', async () => {
      const api = await setup(null)

      const res = await api.delete('/api-keys/key-uuid-1')

      expect(res.status).toBe(401)
      expect(deleteApiKey).not.toHaveBeenCalled()
    })

    it('should return 403 when authenticated but not admin', async () => {
      const api = await setup('User')

      const res = await api.delete('/api-keys/key-uuid-1')

      expect(res.status).toBe(403)
      expect(deleteApiKey).not.toHaveBeenCalled()
    })

    it('should return 404 when key is not found', async () => {
      vi.mocked(deleteApiKey).mockRejectedValue(
        Object.assign(new Error('API key not found'), { statusCode: 404 }),
      )
      const api = await setup('Admin')

      const res = await api.delete('/api-keys/key-uuid-1')

      expect(res.status).toBe(404)
    })
  })

  describe('POST /api-keys/:id/revoke', () => {
    it('should revoke an api key and return 200 (admin)', async () => {
      const revokedKey = { ...mockApiKey, revokedAt: new Date() }
      vi.mocked(revokeApiKey).mockResolvedValue(revokedKey)
      const api = await setup('Admin')

      const res = await api.post('/api-keys/key-uuid-1/revoke')

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({ id: 'key-uuid-1' })
      expect(revokeApiKey).toHaveBeenCalledWith('key-uuid-1', 'admin-uuid-1')
    })

    it('should return 401 when not authenticated', async () => {
      const api = await setup(null)

      const res = await api.post('/api-keys/key-uuid-1/revoke')

      expect(res.status).toBe(401)
      expect(revokeApiKey).not.toHaveBeenCalled()
    })

    it('should return 403 when authenticated but not admin', async () => {
      const api = await setup('User')

      const res = await api.post('/api-keys/key-uuid-1/revoke')

      expect(res.status).toBe(403)
      expect(revokeApiKey).not.toHaveBeenCalled()
    })

    it('should return 400 when key is already revoked', async () => {
      vi.mocked(revokeApiKey).mockRejectedValue(
        Object.assign(new Error('API key is already revoked'), { statusCode: 400 }),
      )
      const api = await setup('Admin')

      const res = await api.post('/api-keys/key-uuid-1/revoke')

      expect(res.status).toBe(400)
    })
  })

  describe('POST /api-keys/:id/renew', () => {
    it('should renew an api key and return 200 with a new plaintext key (admin)', async () => {
      const renewedKey = { ...mockApiKeyWithSecret, key: 'b'.repeat(64) }
      vi.mocked(renewApiKey).mockResolvedValue(renewedKey)
      const api = await setup('Admin')

      const res = await api.post('/api-keys/key-uuid-1/renew')

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({ id: 'key-uuid-1', key: 'b'.repeat(64) })
      expect(renewApiKey).toHaveBeenCalledWith('key-uuid-1', 'admin-uuid-1')
    })

    it('should return 401 when not authenticated', async () => {
      const api = await setup(null)

      const res = await api.post('/api-keys/key-uuid-1/renew')

      expect(res.status).toBe(401)
      expect(renewApiKey).not.toHaveBeenCalled()
    })

    it('should return 403 when authenticated but not admin', async () => {
      const api = await setup('User')

      const res = await api.post('/api-keys/key-uuid-1/renew')

      expect(res.status).toBe(403)
      expect(renewApiKey).not.toHaveBeenCalled()
    })

    it('should return 404 when key is not found', async () => {
      vi.mocked(renewApiKey).mockRejectedValue(
        Object.assign(new Error('API key not found'), { statusCode: 404 }),
      )
      const api = await setup('Admin')

      const res = await api.post('/api-keys/key-uuid-1/renew')

      expect(res.status).toBe(404)
    })
  })
})
