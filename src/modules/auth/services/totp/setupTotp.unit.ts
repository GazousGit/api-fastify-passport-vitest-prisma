import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { prisma } from '../../../../core/prisma.js'
import { setupTotp } from './setupTotp.js'

let userId: string

beforeAll(async () => {
  await prisma.user.deleteMany()
  const user = await prisma.user.create({ data: { email: 'alice@example.com' } })
  userId = user.id
})

beforeEach(async () => {
  await prisma.totpSecret.deleteMany({ where: { userId } })
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('modules -> auth -> totp -> services -> setupTotp', () => {
  it('should create a TotpSecret and return secret and otpauthUri', async () => {
    const newTotp = await setupTotp(userId)

    expect(newTotp.secret).toBeDefined()
    expect(newTotp.otpauthUri).toContain('otpauth://totp/')
    expect(newTotp.otpauthUri).toContain(encodeURIComponent('alice@example.com'))

    const userTotp = await prisma.totpSecret.findUnique({
      where: {
        userId,
      },
    })
    expect(userTotp).not.toBeNull()
    expect(userTotp!.encryptedSeed).toBe(newTotp.secret)
  })

  it('should replace an existing TotpSecret on re-setup', async () => {
    const firstTotp = await setupTotp(userId)
    const secondTotp = await setupTotp(userId)

    expect(secondTotp.secret).not.toBe(firstTotp.secret)
    expect(
      await prisma.totpSecret.count({
        where: {
          userId,
        },
      }),
    ).toBe(1)
  })

  it('should throw when user does not exist', async () => {
    await expect(setupTotp('fake-user-id')).rejects.toThrow()
  })
})
