import { randomBytes } from 'node:crypto'
import { prisma } from '../../../core/prisma.js'
import { redis } from '../../../core/redis.js'
import { sendEmail } from '../../../utils/sendEmail.js'

const TOKEN_TTL_SECONDS = 24 * 60 * 60 // 24 hours
const REDIS_KEY_PREFIX = 'email_verify:'

export async function sendVerificationEmail(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 })

  const token = randomBytes(32).toString('hex')
  await redis.set(`${REDIS_KEY_PREFIX}${token}`, user.id, { EX: TOKEN_TTL_SECONDS })

  await sendEmail({
    to: user.email,
    subject: 'Verify your email address',
    body: `Click the link below to verify your email address:\n\nhttps://example.com/auth/verify-email?token=${token}\n\nThis link expires in 24 hours.`,
  })
}

export async function confirmEmailVerification(token: string): Promise<void> {
  const userId = await redis.get(`${REDIS_KEY_PREFIX}${token}`)
  if (!userId) {
    throw Object.assign(new Error('Invalid or expired verification token'), { statusCode: 400 })
  }

  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true },
  })

  await redis.del(`${REDIS_KEY_PREFIX}${token}`)
}
