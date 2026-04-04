import { vi, describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '../../../core/prisma.js'
import { deleteApiKey } from './deleteApiKey.js'

vi.mock('../../../core/prisma.js', () => ({
  prisma: {
    apiKey: {
      findFirst: vi.fn(),
      delete: vi.fn(),
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

describe('modules -> apiKey -> services -> deleteApiKey', () => {
  it('should delete the key when it belongs to the user', async () => {
    vi.mocked(prisma.apiKey.findFirst).mockResolvedValue(mockApiKey)
    vi.mocked(prisma.apiKey.delete).mockResolvedValue(mockApiKey)

    await deleteApiKey('key-uuid-1', 'user-uuid-1')

    expect(prisma.apiKey.delete).toHaveBeenCalledWith({ where: { id: 'key-uuid-1' } })
  })

  it('should throw 404 when key does not exist or does not belong to user', async () => {
    vi.mocked(prisma.apiKey.findFirst).mockResolvedValue(null)

    await expect(deleteApiKey('key-uuid-1', 'user-uuid-1')).rejects.toMatchObject({
      statusCode: 404,
      message: 'API key not found',
    })

    expect(prisma.apiKey.delete).not.toHaveBeenCalled()
  })
})
