import { generateSecret, generateURI } from 'otplib'
import { prisma } from '../../../../core/prisma.js'

export interface TotpSetupResult {
  secret: string
  otpauthUri: string
}

export async function setupTotp(userId: string, appName = 'API'): Promise<TotpSetupResult> {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
  })

  const secret = generateSecret()
  const otpauthUri = generateURI({
    label: user.email,
    issuer: appName,
    secret,
  })

  await prisma.totpSecret.upsert({
    where: {
      userId,
    },
    create: {
      userId,
      encryptedSeed: secret,
    },
    update: {
      encryptedSeed: secret,
    },
  })

  return {
    secret,
    otpauthUri,
  }
}
