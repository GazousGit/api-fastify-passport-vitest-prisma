import { vi, describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '../../../core/prisma.js'
import { getUserById } from './getUserById.js'

vi.mock('../../../core/prisma.js', () => ({
  prisma: { user: { findUnique: vi.fn() } },
}))

const mockUser = {
  id: 'cuid-1',
  email: 'alice@example.com',
  firstName: 'Alice',
  lastName: 'Smith',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

beforeEach(() => vi.clearAllMocks())

describe('modules -> user -> services -> getUserById', () => {
  it('should returns the user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)

    const result = await getUserById('cuid-1')

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'cuid-1' } })
    expect(result).toEqual(mockUser)
  })

  it('should throws a 404 error', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    await expect(getUserById('unknown')).rejects.toMatchObject({ statusCode: 404 })
  })
})
