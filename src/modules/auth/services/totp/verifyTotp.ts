import { verify } from 'otplib'
import { prisma } from '../../../../core/prisma.js'

export async function verifyTotp(userId: string, code: string): Promise<boolean> {
  const record = await prisma.totpSecret.findUnique({ where: { userId } })
  if (!record) return false // TODO filter the select on encryptedSeed (Check if it's a better practice to do so)

  const { valid } = await verify({ token: code, secret: record.encryptedSeed })
  return valid
}
