import { vi, describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '../../../core/prisma.js'
import { updateUser } from './updateUser.js'

vi.mock('../../../core/prisma.js', () => ({
  prisma: { user: { update: vi.fn() } },
}))

const mockUser = {
  id: 'cuid-1',
  email: 'alice-new@example.com',
  firstName: 'Alice',
  lastName: 'Updated',
  userName: null,
  mobilePhone: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
}

beforeEach(() => vi.clearAllMocks())

describe('modules -> user -> services -> updateUser', () => {
  it('should update the user with all provided fields', async () => {
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser)

    const input = { email: 'alice-new@example.com', firstName: 'Alice', lastName: 'Updated' }
    const result = await updateUser('cuid-1', input)

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'cuid-1' },
      data: { email: 'alice-new@example.com', firstName: 'Alice', lastName: 'Updated', userName: null, mobilePhone: null },
    })
    expect(result).toEqual(mockUser)
  })

  it('should null out omitted nullable fields (PUT replacement semantics)', async () => {
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser)

    await updateUser('cuid-1', { email: 'alice-new@example.com' })

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'cuid-1' },
      data: { email: 'alice-new@example.com', firstName: null, lastName: null, userName: null, mobilePhone: null },
    })
  })

  it('should throw record not found', async () => {
    vi.mocked(prisma.user.update).mockRejectedValue(new Error('P2025'))

    await expect(updateUser('unknown', { email: 'x@x.com' })).rejects.toThrow('P2025')
  })
})
