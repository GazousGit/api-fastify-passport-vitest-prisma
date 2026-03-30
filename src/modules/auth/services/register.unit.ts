import { vi, describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '../../../core/prisma.js'
import { register } from './register.js'
import type { User } from '../../../modules/user/type.js'

vi.mock('../../../core/prisma.js', () => ({
  prisma: { user: { create: vi.fn() } },
}))

vi.mock('argon2', () => ({
  default: { hash: vi.fn().mockResolvedValue('hashed_password') },
}))

const mockUser: User = {
  id: 'uuid-1',
  email: 'alice@example.com',
  emailVerified: false,
  firstName: 'Alice',
  lastName: null,
  userName: null,
  mobilePhone: null,
  mobilePhoneVerified: false,
  role: 'User' as const,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

beforeEach(() => vi.clearAllMocks())

describe('modules -> auth -> services -> register', () => {
  it('should create a user with a hashed password', async () => {
    vi.mocked(prisma.user.create).mockResolvedValue(mockUser)

    const result = await register({ email: 'alice@example.com', password: 'Password1!' })

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'alice@example.com',
        localAuth: { create: { passwordHash: 'hashed_password' } },
      }),
    })
    expect(result).toEqual(mockUser)
  })

  it('should throw 400 for a weak password', async () => {
    await expect(register({ email: 'alice@example.com', password: 'weak' })).rejects.toMatchObject({
      statusCode: 400,
    })

    expect(prisma.user.create).not.toHaveBeenCalled()
  })
})
