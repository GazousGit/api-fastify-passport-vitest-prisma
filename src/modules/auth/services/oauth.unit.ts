import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { prisma } from '../../../core/prisma.js'
import { findOrCreateOAuthUser } from './oauth.js'

beforeEach(async () => {
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})

const googleInput = {
  provider: 'google',
  providerAccountId: 'google-123',
  email: 'alice@example.com',
  emailVerified: false,
  accessToken: 'new_token',
}

describe('modules -> auth -> services -> findOrCreateOAuthUser', () => {
  describe('existing OAuthAccount', () => {
    it('should return the linked user and refresh the tokens', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'alice@example.com',
          oauthAccounts: {
            create: {
              provider: 'google',
              providerAccountId: 'google-123',
              accessToken: 'old_token',
            },
          },
        },
      })

      const result = await findOrCreateOAuthUser({
        ...googleInput,
        accessToken: 'refreshed_token',
      })

      expect(result.id).toBe(user.id)
      const account = await prisma.oAuthAccount.findUnique({
        where: {
          provider_providerAccountId: {
            provider: 'google',
            providerAccountId: 'google-123',
          },
        },
      })
      expect(account!.accessToken).toBe('refreshed_token')
    })
  })

  describe('email matches an existing user', () => {
    it('should link the provider and return the user', async () => {
      await prisma.user.create({ data: { email: 'alice@example.com', emailVerified: true } })

      const result = await findOrCreateOAuthUser({ ...googleInput, emailVerified: true })

      expect(result.email).toBe('alice@example.com')
      const account = await prisma.oAuthAccount.findUnique({
        where: {
          provider_providerAccountId: { provider: 'google', providerAccountId: 'google-123' },
        },
      })
      expect(account).not.toBeNull()
    })

    it('should mark email as verified when the provider confirms it and the user has not', async () => {
      await prisma.user.create({ data: { email: 'alice@example.com', emailVerified: false } })

      const result = await findOrCreateOAuthUser({ ...googleInput, emailVerified: true })

      expect(result.emailVerified).toBe(true)
      const updated = await prisma.user.findUnique({ where: { email: 'alice@example.com' } })
      expect(updated!.emailVerified).toBe(true)
    })

    it('should not update emailVerified when the provider does not confirm it', async () => {
      await prisma.user.create({ data: { email: 'alice@example.com', emailVerified: false } })

      const result = await findOrCreateOAuthUser({ ...googleInput, emailVerified: false })

      expect(result.emailVerified).toBe(false)
    })
  })

  describe('no matching account or email', () => {
    it('should create a new user with an OAuthAccount', async () => {
      const result = await findOrCreateOAuthUser(googleInput)

      expect(result.email).toBe('alice@example.com')
      expect(await prisma.user.count()).toBe(1)
      const account = await prisma.oAuthAccount.findUnique({
        where: {
          provider_providerAccountId: { provider: 'google', providerAccountId: 'google-123' },
        },
      })
      expect(account).not.toBeNull()
    })

    it('should generate a synthetic email when none is provided', async () => {
      const result = await findOrCreateOAuthUser({
        provider: 'github',
        providerAccountId: 'gh-456',
      })

      expect(result.email).toBe('github.gh-456@oauth.local')
    })
  })
})
