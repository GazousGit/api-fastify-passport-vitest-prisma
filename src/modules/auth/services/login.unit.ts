import { vi, describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '../../../core/prisma.js'
import { login } from './login.js'
import type { UserRole } from '../../../modules/user/type.js'

vi.mock('../../../core/prisma.js', () => ({
  prisma: { user: { findUnique: vi.fn() } },
}))

vi.mock('argon2', () => ({
  default: { verify: vi.fn() },
}))

import argon2 from 'argon2'

const mockRole: UserRole = 'User'

const mockUser = {
  id: 'uuid-1',
  email: 'alice@example.com',
  emailVerified: true,
  firstName: 'Alice',
  lastName: null,
  userName: null,
  mobilePhone: null,
  mobilePhoneVerified: false,
  role: mockRole,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  localAuth: {
    id: 'auth-1',
    userId: 'uuid-1',
    passwordHash: 'hashed_password',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
}

beforeEach(() => vi.clearAllMocks())

describe('modules -> auth -> services -> login', () => {
  it('should return the user on valid credentials', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)
    vi.mocked(argon2.verify).mockResolvedValue(true)

    const result = await login('alice@example.com', 'Password1!')

    expect(result).not.toBeNull()
    expect(result).not.toHaveProperty('localAuth')
    expect(result?.email).toBe('alice@example.com')
  })

  it('should return null when user does not exist', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const result = await login('unknown@example.com', 'Password1!')

    expect(result).toBeNull()
    expect(argon2.verify).not.toHaveBeenCalled()
  })

  it('should return null when user has no local auth', async () => {
    // @ts-expect-error findUnique is typed without `include`, so localAuth is absent from the static type
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ ...mockUser, localAuth: null })

    const result = await login('alice@example.com', 'Password1!')

    expect(result).toBeNull()
    expect(argon2.verify).not.toHaveBeenCalled()
  })

  it('should return null on wrong password', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)
    vi.mocked(argon2.verify).mockResolvedValue(false)

    const result = await login('alice@example.com', 'WrongPass1!')

    expect(result).toBeNull()
  })
})
