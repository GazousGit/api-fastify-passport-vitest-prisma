import { vi, describe, it, expect, beforeEach } from 'vitest'
import { redis } from '../../../../core/redis.js'

vi.mock('../../../../core/redis.js', () => ({
  redis: { get: vi.fn(), del: vi.fn() },
}))

import { verifyOtp } from './verifyOtp.js'

beforeEach(() => vi.clearAllMocks())

describe('modules -> auth -> otp -> verifyOtp', () => {
  it('should return true and delete the EMAIL key on a valid code', async () => {
    vi.mocked(redis.get).mockResolvedValue('123456')
    vi.mocked(redis.del).mockResolvedValue(1)

    expect(await verifyOtp('user-1', '123456', 'EMAIL')).toBe(true)
    expect(redis.del).toHaveBeenCalledWith('otp:email:user-1')
  })

  it('should return true and delete the SMS key on a valid code', async () => {
    vi.mocked(redis.get).mockResolvedValue('123456')
    vi.mocked(redis.del).mockResolvedValue(1)

    expect(await verifyOtp('user-1', '123456', 'SMS')).toBe(true)
    expect(redis.del).toHaveBeenCalledWith('otp:sms:user-1')
  })

  it('should return false when code does not match', async () => {
    vi.mocked(redis.get).mockResolvedValue('999999')

    expect(await verifyOtp('user-1', '123456', 'EMAIL')).toBe(false)
    expect(redis.del).not.toHaveBeenCalled()
  })

  it('should return false when key is expired or missing', async () => {
    vi.mocked(redis.get).mockResolvedValue(null)

    expect(await verifyOtp('user-1', '123456', 'EMAIL')).toBe(false)
  })
})
