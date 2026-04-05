import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { prisma } from '../../../core/prisma.js'
import { setTwoFactorMethod } from './twoFactor.js'

let userId: string

beforeAll(async () => {
  await prisma.user.deleteMany()
  const user = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      localAuth: { create: { passwordHash: 'hash' } },
    },
  })
  userId = user.id
})

beforeEach(async () => {
  await prisma.localAuth.update({ where: { userId }, data: { twoFactorMethod: null } })
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('modules -> auth -> services -> setTwoFactorMethod', () => {
  it('should set twoFactorMethod to TOTP', async () => {
    await setTwoFactorMethod(userId, 'TOTP')

    const localAuth = await prisma.localAuth.findUnique({ where: { userId } })
    expect(localAuth!.twoFactorMethod).toBe('TOTP')
  })

  it('should set twoFactorMethod to EMAIL', async () => {
    await setTwoFactorMethod(userId, 'EMAIL')

    const localAuth = await prisma.localAuth.findUnique({ where: { userId } })
    expect(localAuth!.twoFactorMethod).toBe('EMAIL')
  })

  it('should disable 2FA by setting method to null', async () => {
    await setTwoFactorMethod(userId, 'TOTP')

    await setTwoFactorMethod(userId, null)

    const localAuth = await prisma.localAuth.findUnique({ where: { userId } })
    expect(localAuth!.twoFactorMethod).toBeNull()
  })
})
