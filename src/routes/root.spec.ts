import { vi, it, describe, expect, beforeEach, onTestFinished } from 'vitest'
import Fastify from 'fastify'
import request from 'supertest'
import rootRoutes from './root.js'

vi.mock('../core/prisma.js', () => ({
  prisma: {
    apiKey: { findFirst: vi.fn() },
  },
}))

vi.mock('argon2', () => ({
  default: { verify: vi.fn() },
}))

import { prisma } from '../core/prisma.js'
import argon2 from 'argon2'

const mockApiKey = {
  id: 'key-uuid-1',
  userId: 'user-uuid-1',
  name: 'My Key',
  prefix: 'aaaaaaaa',
  keyHash: 'hashed_key',
  scopes: [],
  expiresAt: null,
  lastUsedAt: null,
  revokedAt: null,
  createdAt: new Date('2024-01-01'),
}

async function setup() {
  const app = Fastify({ logger: false })
  await app.register(rootRoutes)
  await app.ready()
  onTestFinished(() => app.close())
  return request(app.server)
}

beforeEach(() => vi.clearAllMocks())

it('GET /health should return status ok', async () => {
  const api = await setup()
  const res = await api.get('/health')
  expect(res.status).toBe(200)
  expect(res.body).toEqual({ status: 'ok' })
})

describe('GET /checkApiKey', () => {
  it('should return missing when Authorization header is absent', async () => {
    const api = await setup()
    const res = await api.get('/checkApiKey')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'missing', message: 'API key required' })
    expect(prisma.apiKey.findFirst).not.toHaveBeenCalled()
  })

  it('should return missing when Authorization header has wrong scheme', async () => {
    const api = await setup()
    const res = await api.get('/checkApiKey').set('Authorization', 'Bearer some-token')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'missing', message: 'API key required' })
  })

  it('should return invalid when prefix is not found in DB', async () => {
    vi.mocked(prisma.apiKey.findFirst).mockResolvedValue(null)
    const api = await setup()
    const res = await api.get('/checkApiKey').set('Authorization', 'ApiKey aaaaaaaa' + 'x'.repeat(56))
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'invalid', message: 'API key is invalid' })
    expect(argon2.verify).not.toHaveBeenCalled()
  })

  it('should return invalid when hash does not match', async () => {
    vi.mocked(prisma.apiKey.findFirst).mockResolvedValue(mockApiKey)
    vi.mocked(argon2.verify).mockResolvedValue(false)
    const api = await setup()
    const res = await api.get('/checkApiKey').set('Authorization', 'ApiKey aaaaaaaa' + 'x'.repeat(56))
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'invalid', message: 'API key is invalid' })
  })

  it('should return revoked when key is revoked', async () => {
    vi.mocked(prisma.apiKey.findFirst).mockResolvedValue({ ...mockApiKey, revokedAt: new Date('2024-06-01') })
    vi.mocked(argon2.verify).mockResolvedValue(true)
    const api = await setup()
    const res = await api.get('/checkApiKey').set('Authorization', 'ApiKey aaaaaaaa' + 'x'.repeat(56))
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'revoked', message: 'API key has been revoked' })
  })

  it('should return expired when key is past its expiry date', async () => {
    vi.mocked(prisma.apiKey.findFirst).mockResolvedValue({
      ...mockApiKey,
      expiresAt: new Date('2020-01-01'),
    })
    vi.mocked(argon2.verify).mockResolvedValue(true)
    const api = await setup()
    const res = await api.get('/checkApiKey').set('Authorization', 'ApiKey aaaaaaaa' + 'x'.repeat(56))
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'expired', message: 'API key has expired' })
  })

  it('should return valid for an active non-expired key', async () => {
    vi.mocked(prisma.apiKey.findFirst).mockResolvedValue(mockApiKey)
    vi.mocked(argon2.verify).mockResolvedValue(true)
    const api = await setup()
    const res = await api.get('/checkApiKey').set('Authorization', 'ApiKey aaaaaaaa' + 'x'.repeat(56))
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'valid', message: 'API key authentication successful' })
  })

  it('should not reveal revoked state when hash is wrong', async () => {
    vi.mocked(prisma.apiKey.findFirst).mockResolvedValue({ ...mockApiKey, revokedAt: new Date('2024-06-01') })
    vi.mocked(argon2.verify).mockResolvedValue(false)
    const api = await setup()
    const res = await api.get('/checkApiKey').set('Authorization', 'ApiKey aaaaaaaa' + 'x'.repeat(56))
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'invalid', message: 'API key is invalid' })
  })
})
