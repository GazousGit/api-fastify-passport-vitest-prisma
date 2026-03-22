import { vi, describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '../../../core/prisma.js'
import { getAllUsers } from './getAllUsers.js'

vi.mock('../../../core/prisma.js', () => ({
  prisma: { user: { findMany: vi.fn() } },
}))

const mockUsers = [
  {
    id: 'cuid-1',
    email: 'alice@example.com',
    firstName: 'Alice',
    lastName: 'Smith',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'cuid-2',
    email: 'bob@example.com',
    firstName: null,
    lastName: null,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
]

beforeEach(() => vi.clearAllMocks())

describe('modules -> user -> services -> getAllUsers', () => {
  it('should returns all users', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers)

    const result = await getAllUsers()

    expect(prisma.user.findMany).toHaveBeenCalledOnce()
    expect(result).toEqual(mockUsers)
  })

  it('should returns an empty array', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([])

    const result = await getAllUsers()

    expect(result).toEqual([])
  })
})
