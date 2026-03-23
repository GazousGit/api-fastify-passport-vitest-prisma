import { vi, describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '../../../core/prisma.js'
import { patchUser } from './patchUser.js'

vi.mock('../../../core/prisma.js', () => ({
  prisma: { user: { update: vi.fn() } },
}))

const mockUser = {
  id: 'cuid-1',
  email: 'alice@example.com',
  firstName: 'Alice',
  lastName: 'Patched',
  userName: null,
  mobilePhone: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
}

beforeEach(() => vi.clearAllMocks())

describe('modules -> user -> services -> patchUser', () => {
  it('should applies a partial update', async () => {
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser)

    const input = { firstName: 'Alice', lastName: 'Patched' }
    const result = await patchUser('cuid-1', input)

    expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 'cuid-1' }, data: input })
    expect(result).toEqual(mockUser)
  })

  it('should throw record not found', async () => {
    vi.mocked(prisma.user.update).mockRejectedValue(new Error('P2025'))

    await expect(patchUser('unknown', { email: 'x@x.com' })).rejects.toThrow('P2025')
  })
})
