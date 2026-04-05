import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { prisma } from '../../../../core/prisma.js'
import { redis } from '../../../../core/redis.js'
import { sendOtp } from './sendOtp.js'

let emailUserId: string
let smsUserId: string
let noPhoneUserId: string

beforeAll(async () => {
  if (!redis.isOpen) await redis.connect()
  await prisma.user.deleteMany()

  const emailUser = await prisma.user.create({ data: { email: 'alice@example.com' } })
  const smsUser = await prisma.user.create({
    data: { email: 'bob@example.com', mobilePhone: '+33600000000' },
  })
  const noPhoneUser = await prisma.user.create({ data: { email: 'carol@example.com' } })

  emailUserId = emailUser.id
  smsUserId = smsUser.id
  noPhoneUserId = noPhoneUser.id
})

beforeEach(async () => {
  await redis.flushDb()
})

afterAll(async () => {
  await redis.quit()
  await prisma.$disconnect()
})

describe('modules -> auth -> otp -> sendOtp (EMAIL)', () => {
  it('should store an OTP in Redis and send the email', async () => {
    await sendOtp(emailUserId, 'EMAIL')

    const keys = await redis.keys('otp:email:*')
    expect(keys).toHaveLength(1)
    expect(await redis.get(keys[0])).toMatch(/^\d{6}$/)
  })

  it('should throw 404 when user does not exist', async () => {
    await expect(sendOtp('00000000-0000-7000-8000-000000000000', 'EMAIL')).rejects.toMatchObject({
      statusCode: 404,
    })
  })
})

describe('modules -> auth -> otp -> sendOtp (SMS)', () => {
  it('should store an OTP in Redis and send the SMS', async () => {
    await sendOtp(smsUserId, 'SMS')

    const keys = await redis.keys('otp:sms:*')
    expect(keys).toHaveLength(1)
    expect(await redis.get(keys[0])).toMatch(/^\d{6}$/)
  })

  it('should throw 400 when user has no mobile phone', async () => {
    await expect(sendOtp(noPhoneUserId, 'SMS')).rejects.toMatchObject({ statusCode: 400 })
  })

  it('should throw 404 when user does not exist', async () => {
    await expect(sendOtp('00000000-0000-7000-8000-000000000000', 'SMS')).rejects.toMatchObject({
      statusCode: 404,
    })
  })
})
