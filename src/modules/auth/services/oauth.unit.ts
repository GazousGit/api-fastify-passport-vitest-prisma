import { vi, describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '../../../core/prisma.js'
import { findOrCreateOAuthUser } from './oauth.js'
import type { User, UserRole } from '../../user/type.js'

vi.mock('../../../core/prisma.js', () => ({
  prisma: {
    oAuthAccount: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
  },
}))

const mockRole: UserRole = 'User'

const mockUser: User = {
  id: 'uuid-1',
  email: 'alice@example.com',
  emailVerified: false,
  firstName: null,
  lastName: null,
  userName: null,
  mobilePhone: null,
  mobilePhoneVerified: false,
  role: mockRole,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const mockOAuthAccount = {
  id: 'oauth-1',
  userId: 'uuid-1',
  provider: 'google',
  providerAccountId: 'google-123',
  accessToken: 'old_token',
  refreshToken: null,
  tokenExpiresAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  user: mockUser,
}

const googleInput = {
  provider: 'google',
  providerAccountId: 'google-123',
  email: 'alice@example.com',
  emailVerified: false,
  accessToken: 'new_token',
}

beforeEach(() => vi.clearAllMocks())

describe('modules -> auth -> services -> findOrCreateOAuthUser', () => {
  describe('existing OAuthAccount', () => {
    it('should return the linked user and refresh the tokens', async () => {
      vi.mocked(prisma.oAuthAccount.findUnique).mockResolvedValue(mockOAuthAccount)
      vi.mocked(prisma.oAuthAccount.update).mockResolvedValue(mockOAuthAccount)

      const result = await findOrCreateOAuthUser(googleInput)

      expect(prisma.oAuthAccount.update).toHaveBeenCalledWith({
        where: { id: 'oauth-1' },
        data: { accessToken: 'new_token', refreshToken: undefined, tokenExpiresAt: undefined },
      })
      expect(prisma.user.findUnique).not.toHaveBeenCalled()
      expect(result).toEqual(mockUser)
    })
  })

  describe('email matches an existing user', () => {
    it('should link the provider and return the user when email is already verified', async () => {
      const verifiedUser: User = { ...mockUser, emailVerified: true }
      vi.mocked(prisma.oAuthAccount.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(verifiedUser)
      vi.mocked(prisma.oAuthAccount.create).mockResolvedValue(mockOAuthAccount)

      const result = await findOrCreateOAuthUser({ ...googleInput, emailVerified: true })

      expect(prisma.oAuthAccount.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'uuid-1',
          provider: 'google',
          providerAccountId: 'google-123',
        }),
      })
      expect(prisma.user.update).not.toHaveBeenCalled()
      expect(result).toEqual(verifiedUser)
    })

    it('should mark email as verified when the provider confirms it and the user has not', async () => {
      const updatedUser: User = { ...mockUser, emailVerified: true }
      vi.mocked(prisma.oAuthAccount.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser) // emailVerified: false
      vi.mocked(prisma.oAuthAccount.create).mockResolvedValue(mockOAuthAccount)
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser)

      const result = await findOrCreateOAuthUser({ ...googleInput, emailVerified: true })

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        data: { emailVerified: true },
      })
      expect(result).toEqual(updatedUser)
    })

    it('should not update email verification when the provider does not confirm it', async () => {
      vi.mocked(prisma.oAuthAccount.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser) // emailVerified: false
      vi.mocked(prisma.oAuthAccount.create).mockResolvedValue(mockOAuthAccount)

      const result = await findOrCreateOAuthUser({ ...googleInput, emailVerified: false })

      expect(prisma.user.update).not.toHaveBeenCalled()
      expect(result).toEqual(mockUser)
    })
  })

  describe('no matching account or email', () => {
    it('should create a new user with an OAuthAccount', async () => {
      vi.mocked(prisma.oAuthAccount.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.user.create).mockResolvedValue(mockUser)

      const result = await findOrCreateOAuthUser(googleInput)

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'alice@example.com',
          emailVerified: false,
          oauthAccounts: {
            create: expect.objectContaining({
              provider: 'google',
              providerAccountId: 'google-123',
            }),
          },
        }),
      })
      expect(result).toEqual(mockUser)
    })

    it('should generate a synthetic email when none is provided', async () => {
      vi.mocked(prisma.oAuthAccount.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.user.create).mockResolvedValue(mockUser)

      await findOrCreateOAuthUser({ provider: 'github', providerAccountId: 'gh-456' })

      expect(prisma.user.findUnique).not.toHaveBeenCalled()
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ email: 'github.gh-456@oauth.local' }),
      })
    })
  })
})
