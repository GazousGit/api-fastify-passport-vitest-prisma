import { vi, describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'

vi.mock('./otp/sendOtp.js')

import { sendOtp } from './otp/sendOtp.js'
import { prisma } from '../../../core/prisma.js'
import { redis } from '../../../core/redis.js'
import { register } from './register.js'
import { login, resolvePendingToken } from './login.js'
import { setTwoFactorMethod } from './twoFactor.js'

beforeAll(async () => {
  if (!redis.isOpen) await redis.connect()
})

beforeEach(async () => {
  await redis.flushDb()
  await prisma.user.deleteMany()
  vi.clearAllMocks()
})

afterAll(async () => {
  await redis.quit()
  await prisma.$disconnect()
})

describe('modules -> auth -> services -> login', () => {
  it('should return user when credentials are valid and no 2FA is configured', async () => {
    await register({ email: 'alice@example.com', password: 'Password1!' })

    const result = await login('alice@example.com', 'Password1!')

    expect(result).toMatchObject({ twoFactorRequired: false })
    expect((result as { user: { email: string } }).user.email).toBe('alice@example.com')
    expect((result as { user: unknown }).user).not.toHaveProperty('localAuth')
  })

  it('should return null on wrong password', async () => {
    await register({ email: 'alice@example.com', password: 'Password1!' })

    expect(await login('alice@example.com', 'WrongPass1!')).toBeNull()
  })

  it('should return null when user does not exist', async () => {
    expect(await login('unknown@example.com', 'Password1!')).toBeNull()
  })

  it('should return a pending token when TOTP method is set', async () => {
    const user = await register({
      email: 'alice@example.com',
      password: 'Password1!',
    })
    await setTwoFactorMethod(user.id, 'TOTP')

    const result = await login('alice@example.com', 'Password1!')

    expect(result).toMatchObject({ twoFactorRequired: true, method: 'TOTP' })
    expect((result as { pendingToken: string }).pendingToken).toBeDefined()
    expect(sendOtp).not.toHaveBeenCalled()
  })

  it('should return a pending token and trigger sendOtp when EMAIL method is set', async () => {
    const user = await register({
      email: 'alice@example.com',
      password: 'Password1!',
    })
    await setTwoFactorMethod(user.id, 'EMAIL')

    const result = await login('alice@example.com', 'Password1!')

    expect(result).toMatchObject({
      twoFactorRequired: true,
      method: 'EMAIL',
    })
    expect(sendOtp).toHaveBeenCalledWith(user.id, 'EMAIL')
  })

  it('should return a pending token and trigger sendOtp when SMS method is set', async () => {
    const user = await register({
      email: 'alice@example.com',
      password: 'Password1!',
    })
    await setTwoFactorMethod(user.id, 'SMS')

    const result = await login('alice@example.com', 'Password1!')

    expect(result).toMatchObject({
      twoFactorRequired: true,
      method: 'SMS',
    })
    expect(sendOtp).toHaveBeenCalledWith(user.id, 'SMS')
  })
})

describe('modules -> auth -> services -> resolvePendingToken', () => {
  it('should return userId and consume the token', async () => {
    await redis.set('pending_2fa:valid_token', 'user-1', { EX: 600 })

    const userId = await resolvePendingToken('valid_token')

    expect(userId).toBe('user-1')
    expect(await redis.get('pending_2fa:valid_token')).toBeNull()
  })

  it('should return null for an expired or unknown token', async () => {
    expect(await resolvePendingToken('expired_token')).toBeNull()
  })
})
