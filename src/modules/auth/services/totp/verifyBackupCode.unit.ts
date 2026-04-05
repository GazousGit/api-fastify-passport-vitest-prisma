import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import argon2 from 'argon2'
import { prisma } from '../../../../core/prisma.js'
import { verifyBackupCode } from './verifyBackupCode.js'

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
})

afterAll(async () => {
  await prisma.$disconnect()
})

async function seedBackupCodes(codes: string[]) {
  const hashed = await Promise.all(codes.map((c) => argon2.hash(c)))
  await prisma.backupCode.createMany({
    data: hashed.map((codeHash) => ({
      userId,
      codeHash,
    })),
  })
}

describe('modules -> auth -> totp -> services -> verifyBackupCode', () => {
  it('should return true and mark the matched code as used', async () => {
    await seedBackupCodes(['abc123', 'def456'])

    expect(await verifyBackupCode(userId, 'abc123')).toBe(true)

    const codes = await prisma.backupCode.findMany({ where: { userId } })
    expect(codes.filter((c) => c.usedAt !== null)).toHaveLength(1)
    expect(codes.filter((c) => c.usedAt === null)).toHaveLength(1)
  })

  it('should return false when no code matches', async () => {
    await seedBackupCodes(['abc123'])

    expect(await verifyBackupCode(userId, 'wrongcode')).toBe(false)

    const codes = await prisma.backupCode.findMany({ where: { userId } })
    expect(codes.every((c) => c.usedAt === null)).toBe(true)
  })

  it('should ignore already-used codes', async () => {
    await seedBackupCodes(['abc123'])
    await verifyBackupCode(userId, 'abc123')

    expect(await verifyBackupCode(userId, 'abc123')).toBe(false)
  })

  it('should return false when there are no unused backup codes', async () => {
    expect(await verifyBackupCode(userId, 'any')).toBe(false)
  })
})
