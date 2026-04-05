import { redis } from '../../../../core/redis.js'
import type { OtpChannel } from './sendOtp.js'

export async function verifyOtp(
  userId: string,
  code: string,
  channel: OtpChannel,
): Promise<boolean> {
  const key = `otp:${channel.toLowerCase()}:${userId}`
  const stored = await redis.get(key)

  if (!stored || stored !== code) {
    return false
  }

  await redis.del(key)
  return true
}
