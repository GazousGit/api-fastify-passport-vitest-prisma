import { vi, describe, it, expect, beforeEach, onTestFinished } from 'vitest'
import { BadRequest } from '../../core/errors/index.js'
import Fastify from 'fastify'
import request from 'supertest'
import twoFactorRoutes from './two-factor.js'

vi.mock('../../modules/auth/services/login.js')
vi.mock('../../modules/auth/services/twoFactor.js')
vi.mock('../../modules/auth/services/otp/sendOtp.js')
vi.mock('../../modules/auth/services/otp/verifyOtp.js')
vi.mock('../../modules/auth/services/totp/setupTotp.js')
vi.mock('../../modules/auth/services/totp/enableTotp.js')
vi.mock('../../modules/auth/services/totp/disableTotp.js')
vi.mock('../../modules/auth/services/totp/verifyTotp.js')
vi.mock('../../modules/auth/services/totp/verifyBackupCode.js')
vi.mock('../../core/prisma.js', () => ({
  prisma: { user: { findUnique: vi.fn() } },
}))
vi.mock('../../core/redis.js', () => ({
  redis: { get: vi.fn() },
}))

import { resolvePendingToken } from '../../modules/auth/services/login.js'
import { setTwoFactorMethod } from '../../modules/auth/services/twoFactor.js'
import { sendOtp } from '../../modules/auth/services/otp/sendOtp.js'
import { verifyOtp } from '../../modules/auth/services/otp/verifyOtp.js'
import { setupTotp } from '../../modules/auth/services/totp/setupTotp.js'
import { enableTotp } from '../../modules/auth/services/totp/enableTotp.js'
import { disableTotp } from '../../modules/auth/services/totp/disableTotp.js'
import { verifyTotp } from '../../modules/auth/services/totp/verifyTotp.js'
import { verifyBackupCode } from '../../modules/auth/services/totp/verifyBackupCode.js'
import { prisma } from '../../core/prisma.js'
import { redis } from '../../core/redis.js'

const mockUser = { id: 'user-1', email: 'alice@example.com', role: 'User' }

async function setup(authenticated = true) {
  const app = Fastify({ logger: false })

  app.decorateRequest('isAuthenticated', function () {
    return authenticated
  })
  app.decorateRequest('logIn', async function () {})

  app.addHook('preHandler', (req, _reply, done) => {
    if (authenticated) {
      ;(req as unknown as { user: typeof mockUser }).user = mockUser
    }
    done()
  })

  await app.register(twoFactorRoutes, { prefix: '/auth' })
  await app.ready()
  onTestFinished(() => app.close())
  return request(app.server)
}

beforeEach(() => vi.clearAllMocks())

describe('routes -> auth -> two-factor', () => {
  describe('POST /auth/2fa/verify', () => {
    it('should complete login with a valid TOTP code', async () => {
      vi.mocked(resolvePendingToken).mockResolvedValue('user-1')
      vi.mocked(verifyTotp).mockResolvedValue(true)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never)
      const api = await setup(false)

      const res = await api
        .post('/auth/2fa/verify')
        .send({ pendingToken: 'tok', code: '123456', type: 'totp' })

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({ id: 'user-1', email: 'alice@example.com' })
    })

    it('should complete login with a valid email OTP', async () => {
      vi.mocked(resolvePendingToken).mockResolvedValue('user-1')
      vi.mocked(verifyOtp).mockResolvedValue(true)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never)
      const api = await setup(false)

      const res = await api
        .post('/auth/2fa/verify')
        .send({ pendingToken: 'tok', code: '123456', type: 'email' })

      expect(res.status).toBe(200)
      expect(verifyOtp).toHaveBeenCalledWith('user-1', '123456', 'EMAIL')
    })

    it('should complete login with a valid SMS OTP', async () => {
      vi.mocked(resolvePendingToken).mockResolvedValue('user-1')
      vi.mocked(verifyOtp).mockResolvedValue(true)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never)
      const api = await setup(false)

      const res = await api
        .post('/auth/2fa/verify')
        .send({ pendingToken: 'tok', code: '123456', type: 'sms' })

      expect(res.status).toBe(200)
      expect(verifyOtp).toHaveBeenCalledWith('user-1', '123456', 'SMS')
    })

    it('should complete login with a valid backup code', async () => {
      vi.mocked(resolvePendingToken).mockResolvedValue('user-1')
      vi.mocked(verifyBackupCode).mockResolvedValue(true)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never)
      const api = await setup(false)

      const res = await api
        .post('/auth/2fa/verify')
        .send({ pendingToken: 'tok', code: 'abcde01234', type: 'backup' })

      expect(res.status).toBe(200)
    })

    it('should return 401 for an invalid or expired pendingToken', async () => {
      vi.mocked(resolvePendingToken).mockResolvedValue(null)
      const api = await setup(false)

      const res = await api
        .post('/auth/2fa/verify')
        .send({ pendingToken: 'bad', code: '123456', type: 'totp' })

      expect(res.status).toBe(401)
    })

    it('should return 401 when the code is wrong', async () => {
      vi.mocked(resolvePendingToken).mockResolvedValue('user-1')
      vi.mocked(verifyTotp).mockResolvedValue(false)
      const api = await setup(false)

      const res = await api
        .post('/auth/2fa/verify')
        .send({ pendingToken: 'tok', code: 'wrong', type: 'totp' })

      expect(res.status).toBe(401)
    })
  })

  describe('POST /auth/2fa/email/resend', () => {
    it('should resend email OTP and return 204', async () => {
      vi.mocked(redis.get).mockResolvedValue('user-1')
      vi.mocked(sendOtp).mockResolvedValue(undefined)
      const api = await setup(false)

      const res = await api.post('/auth/2fa/email/resend').send({ pendingToken: 'tok' })

      expect(res.status).toBe(204)
      expect(sendOtp).toHaveBeenCalledWith('user-1', 'EMAIL')
    })

    it('should return 401 for an invalid or expired pendingToken', async () => {
      vi.mocked(redis.get).mockResolvedValue(null)
      const api = await setup(false)

      const res = await api.post('/auth/2fa/email/resend').send({ pendingToken: 'bad' })

      expect(res.status).toBe(401)
    })
  })

  describe('POST /auth/2fa/email/enable', () => {
    it('should set method to EMAIL and return 204', async () => {
      vi.mocked(setTwoFactorMethod).mockResolvedValue(undefined)
      const api = await setup()

      const res = await api.post('/auth/2fa/email/enable')

      expect(res.status).toBe(204)
      expect(setTwoFactorMethod).toHaveBeenCalledWith('user-1', 'EMAIL')
    })

    it('should return 401 when not authenticated', async () => {
      expect((await (await setup(false)).post('/auth/2fa/email/enable')).status).toBe(401)
    })
  })

  describe('POST /auth/2fa/email/disable', () => {
    it('should set method to null and return 204', async () => {
      vi.mocked(setTwoFactorMethod).mockResolvedValue(undefined)
      const api = await setup()

      const res = await api.post('/auth/2fa/email/disable')

      expect(res.status).toBe(204)
      expect(setTwoFactorMethod).toHaveBeenCalledWith('user-1', null)
    })
  })

  describe('GET /auth/2fa/totp/setup', () => {
    it('should return secret and otpauthUri', async () => {
      vi.mocked(setupTotp).mockResolvedValue({
        secret: 'BASE32SECRET',
        otpauthUri: 'otpauth://totp/...',
      })
      const api = await setup()

      const res = await api.get('/auth/2fa/totp/setup')

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({
        secret: 'BASE32SECRET',
        otpauthUri: expect.stringContaining('otpauth'),
      })
    })

    it('should return 401 when not authenticated', async () => {
      expect((await (await setup(false)).get('/auth/2fa/totp/setup')).status).toBe(401)
    })
  })

  describe('POST /auth/2fa/totp/enable', () => {
    it('should enable TOTP, set method, and return backup codes', async () => {
      vi.mocked(enableTotp).mockResolvedValue(['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'])
      vi.mocked(setTwoFactorMethod).mockResolvedValue(undefined)
      const api = await setup()

      const res = await api.post('/auth/2fa/totp/enable').send({ code: '123456' })

      expect(res.status).toBe(200)
      expect(res.body.backupCodes).toHaveLength(8)
      expect(setTwoFactorMethod).toHaveBeenCalledWith('user-1', 'TOTP')
    })

    it('should return 400 for an invalid TOTP code', async () => {
      vi.mocked(enableTotp).mockRejectedValue(
        new BadRequest('Invalid TOTP code'),
      )
      const api = await setup()

      expect((await api.post('/auth/2fa/totp/enable').send({ code: 'wrong6' })).status).toBe(400)
    })

    it('should return 401 when not authenticated', async () => {
      expect(
        (await (await setup(false)).post('/auth/2fa/totp/enable').send({ code: '123456' })).status,
      ).toBe(401)
    })
  })

  describe('POST /auth/2fa/totp/disable', () => {
    it('should disable TOTP, clear method, and return 204', async () => {
      vi.mocked(disableTotp).mockResolvedValue(undefined)
      vi.mocked(setTwoFactorMethod).mockResolvedValue(undefined)
      const api = await setup()

      const res = await api.post('/auth/2fa/totp/disable').send({ code: '123456' })

      expect(res.status).toBe(204)
      expect(disableTotp).toHaveBeenCalledWith('user-1', '123456')
      expect(setTwoFactorMethod).toHaveBeenCalledWith('user-1', null)
    })

    it('should return 400 for an invalid TOTP code', async () => {
      vi.mocked(disableTotp).mockRejectedValue(
        new BadRequest('Invalid TOTP code'),
      )
      const api = await setup()

      expect((await api.post('/auth/2fa/totp/disable').send({ code: 'wrong6' })).status).toBe(400)
    })

    it('should return 401 when not authenticated', async () => {
      expect(
        (await (await setup(false)).post('/auth/2fa/totp/disable').send({ code: '123456' })).status,
      ).toBe(401)
    })
  })
})
