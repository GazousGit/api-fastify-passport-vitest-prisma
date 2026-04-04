import { vi, describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '../../../core/prisma.js'
import { renewApiKey } from './renewApiKey.js'

vi.mock('../../../core/prisma.js', () => ({
  prisma: {
    apiKey: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('argon2', () => ({
  default: { hash: vi.fn().mockResolvedValue('new_hashed_key') },
}))

vi.mock('node:crypto', () => ({
  randomBytes: vi.fn().mockReturnValue({ toString: () => 'b'.repeat(64) }),
}))

const mockApiKey = {
  id: 'key-uuid-1',
  userId: 'user-uuid-1',
  name: 'My Key',
  prefix: 'aaaaaaaa',
  keyHash: 'old_hashed_key',
  scopes: [],
  expiresAt: null,
  lastUsedAt: new Date('2024-06-01'),
  revokedAt: new Date('2024-07-01'),
  createdAt: new Date('2024-01-01'),
}

beforeEach(() => vi.clearAllMocks())

describe('modules -> apiKey -> services -> renewApiKey', () => {
  it('should generate a new key, clear revokedAt and lastUsedAt, and return the plaintext key', async () => {
    vi.mocked(prisma.apiKey.findFirst).mockResolvedValue(mockApiKey)
    vi.mocked(prisma.apiKey.update).mockResolvedValue({
      ...mockApiKey,
      prefix: 'bbbbbbbb',
      keyHash: 'new_hashed_key',
      revokedAt: null,
      lastUsedAt: null,
    })

    const result = await renewApiKey('key-uuid-1', 'user-uuid-1')

    expect(prisma.apiKey.update).toHaveBeenCalledWith({
      where: { id: 'key-uuid-1' },
      data: {
        prefix: 'bbbbbbbb',
        keyHash: 'new_hashed_key',
        revokedAt: null,
        lastUsedAt: null,
      },
    })
    expect(result.key).toBe('b'.repeat(64))
    expect(result.revokedAt).toBeNull()
    expect(result.lastUsedAt).toBeNull()
    expect(result).not.toHaveProperty('keyHash')
  })

  it('should throw 404 when key does not exist or does not belong to user', async () => {
    vi.mocked(prisma.apiKey.findFirst).mockResolvedValue(null)

    await expect(renewApiKey('key-uuid-1', 'user-uuid-1')).rejects.toMatchObject({
      statusCode: 404,
      message: 'API key not found',
    })

    expect(prisma.apiKey.update).not.toHaveBeenCalled()
  })

  it('should work on an active (non-revoked) key too', async () => {
    vi.mocked(prisma.apiKey.findFirst).mockResolvedValue({ ...mockApiKey, revokedAt: null })
    vi.mocked(prisma.apiKey.update).mockResolvedValue({
      ...mockApiKey,
      prefix: 'bbbbbbbb',
      keyHash: 'new_hashed_key',
      revokedAt: null,
      lastUsedAt: null,
    })

    const result = await renewApiKey('key-uuid-1', 'user-uuid-1')

    expect(result.key).toBe('b'.repeat(64))
  })
})
