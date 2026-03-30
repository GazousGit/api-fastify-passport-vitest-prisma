import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { hasApiKey } from './hasApiKey.js'

vi.mock('../../../core/prisma.js', () => ({
  prisma: {
    apiKey: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('argon2', () => ({
  default: { verify: vi.fn() },
}))

import { prisma } from '../../../core/prisma.js'
import argon2 from 'argon2'

const mockApiKey = {
  id: 'key-1',
  userId: 'user-1',
  name: 'test key',
  prefix: '12345678',
  keyHash: 'hashed_key',
  scopes: [],
  expiresAt: null,
  lastUsedAt: null,
  revokedAt: null,
  createdAt: new Date(),
}

function makeRequest(authorization?: string): FastifyRequest {
  return {
    headers: { authorization },
  } as unknown as FastifyRequest
}

function makeReply() {
  const reply = {
    code: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  }
  return reply as unknown as FastifyReply
}

beforeEach(() => vi.clearAllMocks())

describe('modules -> auth -> hooks -> hasApiKey', () => {
  it('should return 401 when Authorization header is missing', async () => {
    const request = makeRequest(undefined)
    const reply = makeReply()

    await hasApiKey(request, reply)

    expect(reply.code).toHaveBeenCalledWith(401)
    expect(reply.send).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }))
    expect(prisma.apiKey.findFirst).not.toHaveBeenCalled()
  })

  it('should return 401 when Authorization header does not start with "ApiKey "', async () => {
    const request = makeRequest('Bearer some-token')
    const reply = makeReply()

    await hasApiKey(request, reply)

    expect(reply.code).toHaveBeenCalledWith(401)
    expect(prisma.apiKey.findFirst).not.toHaveBeenCalled()
  })

  it('should return 401 when no matching key prefix is found in DB', async () => {
    vi.mocked(prisma.apiKey.findFirst).mockResolvedValue(null)
    const request = makeRequest('ApiKey 12345678abcdefgh')
    const reply = makeReply()

    await hasApiKey(request, reply)

    expect(reply.code).toHaveBeenCalledWith(401)
    expect(argon2.verify).not.toHaveBeenCalled()
  })

  it('should return 401 when argon2 verification fails', async () => {
    vi.mocked(prisma.apiKey.findFirst).mockResolvedValue(mockApiKey)
    vi.mocked(argon2.verify).mockResolvedValue(false)
    const request = makeRequest('ApiKey 12345678abcdefgh')
    const reply = makeReply()

    await hasApiKey(request, reply)

    expect(reply.code).toHaveBeenCalledWith(401)
    expect(prisma.apiKey.update).not.toHaveBeenCalled()
  })

  it('should set apiKeyUserId and update lastUsedAt on a valid key', async () => {
    vi.mocked(prisma.apiKey.findFirst).mockResolvedValue(mockApiKey)
    vi.mocked(argon2.verify).mockResolvedValue(true)
    vi.mocked(prisma.apiKey.update).mockResolvedValue(mockApiKey)

    const request = makeRequest('ApiKey 12345678abcdefgh')
    const reply = makeReply()

    await hasApiKey(request, reply)

    expect(reply.code).not.toHaveBeenCalled()
    expect((request as FastifyRequest & { apiKeyUserId: string }).apiKeyUserId).toBe('user-1')
    expect(prisma.apiKey.update).toHaveBeenCalledWith({
      where: { id: 'key-1' },
      data: { lastUsedAt: expect.any(Date) },
    })
  })
})
