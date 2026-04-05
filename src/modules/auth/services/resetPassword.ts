import { randomBytes } from 'node:crypto'
import argon2 from 'argon2'
import { prisma } from '../../../core/prisma.js'
import { redis } from '../../../core/redis.js'
import { BadRequest } from '../../../core/errors/index.js'
import { isStrongPassword } from '../helpers/isStrongPassword.js'

const TOKEN_TTL_SECONDS = 60 * 60 // 1 hour
const REDIS_KEY_PREFIX = 'password_reset:'

export async function requestPasswordReset(email: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { localAuth: true },
  })

  if (!user?.localAuth) {
    // Return silently — don't reveal whether the email exists
    // the idea is to not expose too much info in prod, a generic message should be displayed in front app
    return ''
  }

  const token = randomBytes(32).toString('hex')
  await redis.set(`${REDIS_KEY_PREFIX}${token}`, user.id, { EX: TOKEN_TTL_SECONDS })

  // In production: send token via email. Here it is returned for the route to handle.
  // TODO implement node mailer at the very least, there's nothing wrong with it (check any free solution)
  return token
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  if (!isStrongPassword(newPassword)) {
    throw new BadRequest('Password must be at least 8 characters and include uppercase, lowercase, digit, and symbol')
  }

  const userId = await redis.get(`${REDIS_KEY_PREFIX}${token}`)
  if (!userId) {
    throw new BadRequest('Invalid or expired reset token')
  }

  const passwordHash = await argon2.hash(newPassword)

  await prisma.localAuth.update({
    where: { userId },
    data: { passwordHash },
  })

  await redis.del(`${REDIS_KEY_PREFIX}${token}`)
}
