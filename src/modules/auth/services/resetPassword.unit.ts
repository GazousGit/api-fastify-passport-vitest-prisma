import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import { prisma } from '../../../core/prisma.js'
import { redis } from '../../../core/redis.js'
import { register } from './register.js'
import { requestPasswordReset, resetPassword } from './resetPassword.js'
import argon2 from 'argon2'

beforeAll(async () => {
  if (!redis.isOpen) await redis.connect()
})

beforeEach(async () => {
  await redis.flushDb()
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await redis.quit()
  await prisma.$disconnect()
})

describe('modules -> auth -> services -> requestPasswordReset', () => {
  it('should store a Redis token and return it', async () => {
    await register({ email: 'alice@example.com', password: 'Password1!' })

    const token = await requestPasswordReset('alice@example.com')

    expect(token).toHaveLength(64) // 32 bytes hex
    const stored = await redis.get(`password_reset:${token}`)
    expect(stored).toBeDefined()
  })

  it('should return empty string silently when email is not found', async () => {
    const token = await requestPasswordReset('unknown@example.com')

    expect(token).toBe('')
  })

  it('should return empty string when user has no local auth (OAuth-only)', async () => {
    await prisma.user.create({ data: { email: 'oauth@example.com' } })

    const token = await requestPasswordReset('oauth@example.com')

    expect(token).toBe('')
  })
})

describe('modules -> auth -> services -> resetPassword', () => {
  it('should update the password hash and delete the token', async () => {
    const user = await register({ email: 'alice@example.com', password: 'Password1!' })
    const token = await requestPasswordReset('alice@example.com')

    await resetPassword(token, 'NewPassword2@')

    const localAuth = await prisma.localAuth.findUnique({ where: { userId: user.id } })
    const valid = await argon2.verify(localAuth!.passwordHash, 'NewPassword2@')
    expect(valid).toBe(true)
    expect(await redis.get(`password_reset:${token}`)).toBeNull()
  })

  it('should throw 400 for an invalid or expired token', async () => {
    await expect(resetPassword('bad_token', 'NewPassword2@')).rejects.toMatchObject({
      statusCode: 400,
    })
  })

  it('should throw 400 for a weak new password', async () => {
    await expect(resetPassword('any_token', 'weak')).rejects.toMatchObject({ statusCode: 400 })
  })
})
