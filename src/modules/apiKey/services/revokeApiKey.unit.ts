import { vi, describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '../../../core/prisma.js'
import { revokeApiKey } from './revokeApiKey.js'

vi.mock('../../../core/prisma.js', () => ({
  prisma: {
    apiKey: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}))

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

beforeEach(() => vi.clearAllMocks())

describe('modules -> apiKey -> services -> revokeApiKey', () => {
  it('should revoke an active key and return it without keyHash', async () => {
    const revokedAt = new Date()
    vi.mocked(prisma.apiKey.findFirst).mockResolvedValue(mockApiKey)
    vi.mocked(prisma.apiKey.update).mockResolvedValue({ ...mockApiKey, revokedAt })

    const result = await revokeApiKey('key-uuid-1', 'user-uuid-1')

    expect(prisma.apiKey.update).toHaveBeenCalledWith({
      where: { id: 'key-uuid-1' },
      data: { revokedAt: expect.any(Date) },
    })
    expect(result.revokedAt).toBe(revokedAt)
    expect(result).not.toHaveProperty('keyHash')
  })

  it('should throw 404 when key does not exist or does not belong to user', async () => {
    vi.mocked(prisma.apiKey.findFirst).mockResolvedValue(null)

    await expect(revokeApiKey('key-uuid-1', 'user-uuid-1')).rejects.toMatchObject({
      statusCode: 404,
      message: 'API key not found',
    })

    expect(prisma.apiKey.update).not.toHaveBeenCalled()
  })

  it('should throw 400 when key is already revoked', async () => {
    vi.mocked(prisma.apiKey.findFirst).mockResolvedValue({
      ...mockApiKey,
      revokedAt: new Date('2024-06-01'),
    })

    await expect(revokeApiKey('key-uuid-1', 'user-uuid-1')).rejects.toMatchObject({
      statusCode: 400,
      message: 'API key is already revoked',
    })

    expect(prisma.apiKey.update).not.toHaveBeenCalled()
  })
})
