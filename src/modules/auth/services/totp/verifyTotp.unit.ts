import { vi, describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'

vi.mock('otplib', () => ({ verify: vi.fn() }))

import { verify } from 'otplib'
import { prisma } from '../../../../core/prisma.js'
import { verifyTotp } from './verifyTotp.js'

let userId: string

beforeAll(async () => {
  await prisma.user.deleteMany()
  const user = await prisma.user.create({
    data: {
      email: 'alice@example.com',
    },
  })
  userId = user.id
})

beforeEach(async () => {
  await prisma.totpSecret.deleteMany({
    where: {
      userId,
    },
  })
  vi.clearAllMocks()
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('modules -> auth -> totp -> services -> verifyTotp', () => {
  it('should return true for a valid code', async () => {
    await prisma.totpSecret.create({
      data: {
        userId,
        encryptedSeed: 'BASE32SECRET',
      },
    })
    vi.mocked(verify).mockResolvedValue({ valid: true } as never)

    expect(await verifyTotp(userId, '123456')).toBe(true)
  })

  it('should return false for an invalid code', async () => {
    await prisma.totpSecret.create({
      data: {
        userId,
        encryptedSeed: 'BASE32SECRET',
      },
    })
    vi.mocked(verify).mockResolvedValue({ valid: false } as never)

    expect(await verifyTotp(userId, 'wrong')).toBe(false)
  })

  it('should return false when TOTP is not set up', async () => {
    expect(await verifyTotp(userId, '123456')).toBe(false)
    expect(verify).not.toHaveBeenCalled()
  })
})
