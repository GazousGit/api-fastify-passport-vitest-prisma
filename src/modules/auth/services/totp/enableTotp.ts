import { randomBytes } from 'node:crypto'
import { verify } from 'otplib'
import argon2 from 'argon2'
import { prisma } from '../../../../core/prisma.js'

const BACKUP_CODE_COUNT = 8

export async function enableTotp(userId: string, code: string): Promise<string[]> {
  const totpSecret = await prisma.totpSecret.findUnique({
    where: {
      userId,
    },
  })
  if (!totpSecret) throw Object.assign(new Error('TOTP setup not started'), { statusCode: 400 })

  const { valid } = await verify({
    token: code,
    secret: totpSecret.encryptedSeed,
  })
  if (!valid) throw Object.assign(new Error('Invalid TOTP code'), { statusCode: 400 })

  const plainCodes = Array.from({ length: BACKUP_CODE_COUNT }, () => randomBytes(5).toString('hex'))
  const hashed = await Promise.all(plainCodes.map((c) => argon2.hash(c)))

  await prisma.backupCode.deleteMany({
    where: {
      userId,
    },
  })
  await prisma.backupCode.createMany({
    data: hashed.map((codeHash) => ({
      userId,
      codeHash,
    })),
  })

  return plainCodes
}
