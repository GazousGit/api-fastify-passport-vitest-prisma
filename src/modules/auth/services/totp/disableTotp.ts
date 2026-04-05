import { verify } from 'otplib'
import { prisma } from '../../../../core/prisma.js'

export async function disableTotp(userId: string, code: string): Promise<void> {
  const record = await prisma.totpSecret.findUnique({ where: { userId } })
  if (!record) throw Object.assign(new Error('TOTP is not enabled'), { statusCode: 400 })

  const { valid } = await verify({ token: code, secret: record.encryptedSeed })
  if (!valid) throw Object.assign(new Error('Invalid TOTP code'), { statusCode: 400 })

  await prisma.$transaction([
    prisma.totpSecret.delete({ where: { userId } }),
    prisma.backupCode.deleteMany({ where: { userId } }),
  ])
}
