import { vi, describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '../../../core/prisma.js'
import { createApiKey } from './createApiKey.js'

vi.mock('../../../core/prisma.js', () => ({
  prisma: {
    apiKey: { create: vi.fn() },
  },
}))

vi.mock('argon2', () => ({
  default: { hash: vi.fn().mockResolvedValue('hashed_key') },
}))

vi.mock('node:crypto', () => ({
  randomBytes: vi.fn().mockReturnValue({ toString: () => 'a'.repeat(64) }),
}))

const mockDbApiKey = {
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

beforeEach(() => vi.clearAllMocks())

describe('modules -> apiKey -> services -> createApiKey', () => {
  it('should create an api key and return it with the plaintext key', async () => {
    vi.mocked(prisma.apiKey.create).mockResolvedValue(mockDbApiKey)

    const result = await createApiKey({ userId: 'user-uuid-1', name: 'My Key' })

    expect(prisma.apiKey.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-uuid-1',
        name: 'My Key',
        prefix: 'aaaaaaaa',
        keyHash: 'hashed_key',
        scopes: [],
        expiresAt: null,
      },
    })
    expect(result.key).toBe('a'.repeat(64))
    expect(result).not.toHaveProperty('keyHash')
  })

  it('should forward scopes and expiresAt when provided', async () => {
    const expiresAt = new Date('2025-01-01')
    vi.mocked(prisma.apiKey.create).mockResolvedValue({
      ...mockDbApiKey,
      scopes: ['read', 'write'],
      expiresAt,
    })

    const result = await createApiKey({
      userId: 'user-uuid-1',
      name: 'My Key',
      scopes: ['read', 'write'],
      expiresAt,
    })

    expect(prisma.apiKey.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ scopes: ['read', 'write'], expiresAt }),
    })
    expect(result.scopes).toEqual(['read', 'write'])
    expect(result.expiresAt).toBe(expiresAt)
  })
})
