import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { UserRole } from '../../../modules/user/type.js'
import { prisma } from '../../../core/prisma.js'
import { redis } from '../../../core/redis.js'
import { requestPasswordReset, resetPassword } from './resetPassword.js'

vi.mock('../../../core/prisma.js', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    localAuth: { update: vi.fn() },
  },
}))

vi.mock('../../../core/redis.js', () => ({
  redis: { set: vi.fn(), get: vi.fn(), del: vi.fn() },
}))

vi.mock('argon2', () => ({
  default: { hash: vi.fn().mockResolvedValue('new_hashed_password') },
}))

vi.mock('node:crypto', () => ({
  randomBytes: vi.fn().mockReturnValue({ toString: () => 'mocked_token_hex' }),
}))

const mockRole: UserRole = 'User'

const mockUser = {
  id: 'uuid-1',
  email: 'alice@example.com',
  emailVerified: true,
  firstName: null,
  lastName: null,
  userName: null,
  mobilePhone: null,
  mobilePhoneVerified: false,
  role: mockRole,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  localAuth: { passwordHash: 'old_hash' },
}

beforeEach(() => vi.clearAllMocks())

describe('modules -> auth -> services -> requestPasswordReset', () => {
  it('should store a token in Redis and return it', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)
    vi.mocked(redis.set).mockResolvedValue('OK')

    const token = await requestPasswordReset('alice@example.com')

    expect(redis.set).toHaveBeenCalledWith(
      expect.stringContaining('password_reset:'),
      'uuid-1',
      { EX: 3600 },
    )
    expect(token).toBe('mocked_token_hex')
  })

  it('should return empty string silently when email not found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const token = await requestPasswordReset('unknown@example.com')

    expect(token).toBe('')
    expect(redis.set).not.toHaveBeenCalled()
  })
})

describe('modules -> auth -> services -> resetPassword', () => {
  it('should update password hash and delete token', async () => {
    vi.mocked(redis.get).mockResolvedValue('uuid-1')
    vi.mocked(prisma.localAuth.update).mockResolvedValue({
      id: 'auth-1',
      userId: 'uuid-1',
      passwordHash: 'new_hashed_password',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    vi.mocked(redis.del).mockResolvedValue(1)

    await resetPassword('valid_token', 'NewPassword1!')

    expect(prisma.localAuth.update).toHaveBeenCalledWith({
      where: { userId: 'uuid-1' },
      data: { passwordHash: 'new_hashed_password' },
    })
    expect(redis.del).toHaveBeenCalledWith('password_reset:valid_token')
  })

  it('should throw 400 for an invalid or expired token', async () => {
    vi.mocked(redis.get).mockResolvedValue(null)

    await expect(resetPassword('expired_token', 'NewPassword1!')).rejects.toMatchObject({
      statusCode: 400,
      message: 'Invalid or expired reset token',
    })

    expect(prisma.localAuth.update).not.toHaveBeenCalled()
  })

  it('should throw 400 for a weak new password', async () => {
    await expect(resetPassword('valid_token', 'weak')).rejects.toMatchObject({
      statusCode: 400,
    })

    expect(redis.get).not.toHaveBeenCalled()
    expect(prisma.localAuth.update).not.toHaveBeenCalled()
  })
})
