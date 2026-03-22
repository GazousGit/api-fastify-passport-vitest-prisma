import { vi, describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '../../../core/prisma.js'
import { deleteUser } from './deleteUser.js'

vi.mock('../../../core/prisma.js', () => ({
  prisma: { user: { delete: vi.fn() } },
}))

beforeEach(() => vi.clearAllMocks())

describe('modules -> user -> services -> deleteUser', () => {
  it('should deletes the user', async () => {
    vi.mocked(prisma.user.delete).mockResolvedValue({
      id: 'cuid-1',
      email: 'alice@example.com',
      firstName: 'Alice',
      lastName: 'Smith',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await expect(deleteUser('cuid-1')).resolves.toBeUndefined()
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'cuid-1' } })
  })

  it('should throw not found', async () => {
    vi.mocked(prisma.user.delete).mockRejectedValue(new Error('P2025'))

    await expect(deleteUser('unknown')).rejects.toThrow('P2025')
  })
})
