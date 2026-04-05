import { randomInt } from 'node:crypto'
import { prisma } from '../../../../core/prisma.js'
import { redis } from '../../../../core/redis.js'
import { sendEmail } from '../../../../utils/sendEmail.js'
import { sendSms } from '../../../../utils/sendSms.js'

const OTP_TTL_SECONDS = 10 * 60 // 10 minutes

export type OtpChannel = 'EMAIL' | 'SMS'

function redisKey(channel: OtpChannel, userId: string): string {
  return `otp:${channel.toLowerCase()}:${userId}`
}

function generateOtp(): string {
  return String(randomInt(100_000, 999_999))
}

export async function sendOtp(userId: string, channel: OtpChannel): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } })

  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 })
  }

  if (channel === 'SMS' && !user.mobilePhone) {
    throw Object.assign(new Error('No mobile phone number on file'), { statusCode: 400 })
  }

  const otp = generateOtp()
  await redis.set(redisKey(channel, userId), otp, { EX: OTP_TTL_SECONDS })

  if (channel === 'EMAIL') {
    await sendEmail({
      to: user.email,
      subject: 'Your login verification code',
      body: `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.`,
    })
  } else {
    await sendSms({
      to: user.mobilePhone!,
      body: `Your verification code is: ${otp}. Expires in 10 minutes.`,
    })
  }
}
