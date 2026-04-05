import argon2 from 'argon2'
import { prisma } from '../../../../core/prisma.js'

export async function verifyBackupCode(userId: string, code: string): Promise<boolean> {
  const records = await prisma.backupCode.findMany({
    where: { userId, usedAt: null },
  })

  for (const record of records) {
    const match = await argon2.verify(record.codeHash, code)
    if (match) {
      await prisma.backupCode.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      })
      return true
    }
  }

  return false
}
