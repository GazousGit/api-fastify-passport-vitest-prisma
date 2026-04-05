import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { prisma } from '../../../core/prisma.js'
import { redis } from '../../../core/redis.js'
import { sendVerificationEmail, confirmEmailVerification } from './verifyEmail.js'

let userId: string

beforeAll(async () => {
  if (!redis.isOpen) await redis.connect()
  await prisma.user.deleteMany()
  const user = await prisma.user.create({ data: { email: 'alice@example.com' } })
  userId = user.id
})

beforeEach(async () => {
  await redis.flushDb()
  await prisma.user.update({ where: { id: userId }, data: { emailVerified: false } })
})

afterAll(async () => {
  await redis.quit()
  await prisma.$disconnect()
})

describe('modules -> auth -> services -> sendVerificationEmail', () => {
  it('should store a Redis token for the user', async () => {
    await sendVerificationEmail(userId)

    const keys = await redis.keys('email_verify:*')
    expect(keys).toHaveLength(1)
    expect(await redis.get(keys[0])).toBe(userId)
  })

  it('should throw 404 when user does not exist', async () => {
    await expect(
      sendVerificationEmail('00000000-0000-7000-8000-000000000000'),
    ).rejects.toMatchObject({ statusCode: 404 })
  })
})

describe('modules -> auth -> services -> confirmEmailVerification', () => {
  it('should mark emailVerified as true and delete the token', async () => {
    await sendVerificationEmail(userId)
    const [key] = await redis.keys('email_verify:*')
    const token = key.replace('email_verify:', '')

    await confirmEmailVerification(token)

    const updated = await prisma.user.findUnique({ where: { id: userId } })
    expect(updated!.emailVerified).toBe(true)
    expect(await redis.get(key)).toBeNull()
  })

  it('should throw 400 for an invalid or expired token', async () => {
    await expect(confirmEmailVerification('bad_token')).rejects.toMatchObject({ statusCode: 400 })
  })
})
