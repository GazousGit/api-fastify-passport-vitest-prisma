import { randomBytes } from 'node:crypto'
import argon2 from 'argon2'
import type { TwoFactorMethod } from '@prisma/client'
import { prisma } from '../../../core/prisma.js'
import { redis } from '../../../core/redis.js'
import { sendOtp } from './otp/sendOtp.js'
import type { User } from '../../user/type.js'

const PENDING_2FA_TTL_SECONDS = 10 * 60 // 10 minutes

export const PENDING_2FA_PREFIX = 'pending_2fa:'

export interface LoginResult {
  user: User
  twoFactorRequired: false
}

export interface TwoFactorPendingResult {
  twoFactorRequired: true
  pendingToken: string
  method: TwoFactorMethod
}

export type LoginOutput = LoginResult | TwoFactorPendingResult

export async function login(email: string, password: string): Promise<LoginOutput | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { localAuth: true },
  })

  if (!user?.localAuth) return null

  const valid = await argon2.verify(user.localAuth.passwordHash, password)
  if (!valid) return null

  const method = user.localAuth.twoFactorMethod

  if (method) {
    const pendingToken = randomBytes(32).toString('hex')
    await redis.set(`${PENDING_2FA_PREFIX}${pendingToken}`, user.id, {
      EX: PENDING_2FA_TTL_SECONDS,
    })

    if (method === 'EMAIL' || method === 'SMS') await sendOtp(user.id, method)

    return {
      twoFactorRequired: true,
      pendingToken,
      method,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { localAuth: _localAuth, ...safeUser } = user //TODO use lodash omit here ?

  return {
    twoFactorRequired: false,
    user: safeUser,
  }
}

export async function resolvePendingToken(pendingToken: string): Promise<string | null> {
  const userId = await redis.get(`${PENDING_2FA_PREFIX}${pendingToken}`)
  if (!userId) return null
  await redis.del(`${PENDING_2FA_PREFIX}${pendingToken}`)
  return userId
}
