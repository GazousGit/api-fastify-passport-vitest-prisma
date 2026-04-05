import { verify } from 'otplib'
import { prisma } from '../../../../core/prisma.js'
import { BadRequest } from '../../../../core/errors/index.js'

export async function disableTotp(userId: string, code: string): Promise<void> {
  const record = await prisma.totpSecret.findUnique({ where: { userId } })
  if (!record) throw new BadRequest('TOTP is not enabled')

  const { valid } = await verify({ token: code, secret: record.encryptedSeed })
  if (!valid) throw new BadRequest('Invalid TOTP code')

  await prisma.$transaction([
    prisma.totpSecret.delete({ where: { userId } }),
    prisma.backupCode.deleteMany({ where: { userId } }),
  ])
}
