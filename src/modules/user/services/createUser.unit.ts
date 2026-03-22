import { vi, describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '../../../core/prisma.js'
import { createUser } from './createUser.js'

vi.mock('../../../core/prisma.js', () => ({
  prisma: { user: { create: vi.fn() } },
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

describe('modules -> user -> services -> createUser', () => {
  it('should creates a new user', async () => {
    vi.mocked(prisma.user.create).mockResolvedValue(mockUser)

    const input = { email: 'alice@example.com', firstName: 'Alice', lastName: 'Smith' }
    const result = await createUser(input)

    expect(prisma.user.create).toHaveBeenCalledWith({ data: input })
    expect(result).toEqual(mockUser)
  })

  it('should throw unique constraint', async () => {
    vi.mocked(prisma.user.create).mockRejectedValue(new Error('unique constraint'))

    await expect(createUser({ email: 'alice@example.com' })).rejects.toThrow('unique constraint')
  })
})
