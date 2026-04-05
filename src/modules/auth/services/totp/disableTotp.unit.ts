import { vi, describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'

vi.mock('otplib', () => ({ verify: vi.fn() }))

import { verify } from 'otplib'
import { prisma } from '../../../../core/prisma.js'
import { disableTotp } from './disableTotp.js'

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
  await prisma.backupCode.deleteMany({
    where: {
      userId,
    },
  })
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

async function seedTotpAndBackupCodes() {
  await prisma.totpSecret.create({ data: { userId, encryptedSeed: 'BASE32SECRET' } })
  await prisma.backupCode.createMany({
    data: Array.from({ length: 8 }, () => ({
      userId,
      codeHash: 'hash',
    })),
  })
}

describe('modules -> auth -> totp -> services -> disableTotp', () => {
  it('should delete TotpSecret and all BackupCodes on valid code', async () => {
    await seedTotpAndBackupCodes()
    vi.mocked(verify).mockResolvedValue({ valid: true } as never)

    await disableTotp(userId, '123456')

    expect(
      await prisma.totpSecret.findUnique({
        where: {
          userId,
        },
      }),
    ).toBeNull()
    expect(
      await prisma.backupCode.count({
        where: {
          userId,
        },
      }),
    ).toBe(0)
  })

  it('should throw 400 when TOTP is not enabled', async () => {
    await expect(disableTotp(userId, '123456')).rejects.toMatchObject({
      statusCode: 400,
      message: 'TOTP is not enabled',
    })
  })

  it('should throw 400 when code is invalid and leave data intact', async () => {
    await seedTotpAndBackupCodes()
    vi.mocked(verify).mockResolvedValue({ valid: false } as never)

    await expect(disableTotp(userId, 'wrong')).rejects.toMatchObject({
      statusCode: 400,
      message: 'Invalid TOTP code',
    })

    expect(
      await prisma.totpSecret.findUnique({
        where: {
          userId,
        },
      }),
    ).not.toBeNull()
    expect(
      await prisma.backupCode.count({
        where: {
          userId,
        },
      }),
    ).toBe(8)
  })
})
