import { vi, describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'

vi.mock('otplib', () => ({ verify: vi.fn() }))

import { verify } from 'otplib'
import { prisma } from '../../../../core/prisma.js'
import { enableTotp } from './enableTotp.js'

let userId: string

beforeAll(async () => {
  await prisma.user.deleteMany()
  const user = await prisma.user.create({ data: { email: 'alice@example.com' } })
  userId = user.id
})

beforeEach(async () => {
  await prisma.backupCode.deleteMany({ where: { userId } })
  await prisma.totpSecret.deleteMany({ where: { userId } })
  vi.clearAllMocks()
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('modules -> auth -> totp -> services -> enableTotp', () => {
  it('should generate and persist 8 backup codes, then return the plain codes', async () => {
    await prisma.totpSecret.create({ data: { userId, encryptedSeed: 'BASE32SECRET' } })
    vi.mocked(verify).mockResolvedValue({ valid: true } as never)

    const codes = await enableTotp(userId, '123456')

    expect(codes).toHaveLength(8)
    codes.forEach((c) => expect(c).toHaveLength(10)) // 5 bytes hex

    const stored = await prisma.backupCode.findMany({ where: { userId } })
    expect(stored).toHaveLength(8)
    stored.forEach((r) => expect(r.codeHash).toMatch(/^\$argon2/))
  })

  it('should replace any previous backup codes', async () => {
    await prisma.totpSecret.create({ data: { userId, encryptedSeed: 'BASE32SECRET' } })
    vi.mocked(verify).mockResolvedValue({ valid: true } as never)

    await enableTotp(userId, '123456')
    await enableTotp(userId, '123456')

    expect(await prisma.backupCode.count({ where: { userId } })).toBe(8)
  })

  it('should throw 400 when TOTP setup was not started', async () => {
    await expect(enableTotp(userId, '123456')).rejects.toMatchObject({
      statusCode: 400,
      message: 'TOTP setup not started',
    })
  })

  it('should throw 400 when code is invalid', async () => {
    await prisma.totpSecret.create({ data: { userId, encryptedSeed: 'BASE32SECRET' } })
    vi.mocked(verify).mockResolvedValue({ valid: false } as never)

    await expect(enableTotp(userId, 'wrong')).rejects.toMatchObject({
      statusCode: 400,
      message: 'Invalid TOTP code',
    })
    expect(
      await prisma.backupCode.count({
        where: {
          userId,
        },
      }),
    ).toBe(0)
  })
})
