import type { TwoFactorMethod } from '@prisma/client'
import { prisma } from '../../../core/prisma.js'

export async function setTwoFactorMethod(userId: string, method: TwoFactorMethod | null): Promise<void> {
  await prisma.localAuth.update({
    where: { userId },
    data: { twoFactorMethod: method },
  })
}
