import '@fastify/swagger'
import type { FastifyPluginAsync } from 'fastify'
import type { User } from '../../modules/user/type.js'
import { isAuthenticated } from '../../modules/auth/hooks/isAuthenticated.js'
import { resolvePendingToken, PENDING_2FA_PREFIX } from '../../modules/auth/services/login.js'
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

const errorSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'number' },
    error: { type: 'string' },
    message: { type: 'string' },
  },
} as const

const twoFactorRoutes: FastifyPluginAsync = async (app): Promise<void> => {
  // ─── Login completion ───────────────────────────────────────────────────────

  // POST /auth/2fa/verify
  app.post<{
    Body: { pendingToken: string; code: string; type: 'totp' | 'email' | 'sms' | 'backup' }
  }>(
    '/2fa/verify',
    {
      schema: {
        tags: ['auth'],
        summary: 'Complete login with a 2FA code',
        security: [],
        body: {
          type: 'object',
          required: ['pendingToken', 'code', 'type'],
          properties: {
            pendingToken: { type: 'string' },
            code: { type: 'string' },
            type: { type: 'string', enum: ['totp', 'email', 'sms', 'backup'] },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: { id: { type: 'string' }, email: { type: 'string' } },
          },
          400: errorSchema,
          401: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const { pendingToken, code, type } = request.body

      const userId = await resolvePendingToken(pendingToken)
      if (!userId) {
        return reply
          .code(401)
          .send({ statusCode: 401, error: 'Unauthorized', message: 'Invalid or expired token' })
      }

      let verified = false
      if (type === 'totp') verified = await verifyTotp(userId, code)
      else if (type === 'email') verified = await verifyOtp(userId, code, 'EMAIL')
      else if (type === 'sms') verified = await verifyOtp(userId, code, 'SMS')
      else if (type === 'backup') verified = await verifyBackupCode(userId, code)

      if (!verified) {
        return reply
          .code(401)
          .send({ statusCode: 401, error: 'Unauthorized', message: 'Invalid code' })
      }

      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user) {
        return reply
          .code(401)
          .send({ statusCode: 401, error: 'Unauthorized', message: 'User not found' })
      }

      await request.logIn(user)
      return reply.send({ id: user.id, email: user.email })
    },
  )

  // POST /auth/2fa/email/resend
  app.post<{ Body: { pendingToken: string } }>(
    '/2fa/email/resend',
    {
      config: { rateLimit: { max: 3, timeWindow: 60_000 } },
      schema: {
        tags: ['auth'],
        summary: 'Resend the email OTP for a pending 2FA login',
        security: [],
        body: {
          type: 'object',
          required: ['pendingToken'],
          properties: { pendingToken: { type: 'string' } },
        },
        response: {
          204: { type: 'null', description: 'No content' },
          401: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const userId = await redis.get(`${PENDING_2FA_PREFIX}${request.body.pendingToken}`)

      if (!userId) {
        return reply
          .code(401)
          .send({ statusCode: 401, error: 'Unauthorized', message: 'Invalid or expired token' })
      }

      await sendOtp(userId, 'EMAIL')
      return reply.code(204).send()
    },
  )

  // ─── Email 2FA management (authenticated) ──────────────────────────────────

  // POST /auth/2fa/email/enable
  app.post(
    '/2fa/email/enable',
    {
      schema: {
        tags: ['auth'],
        summary: 'Enable email 2FA for the current user',
        security: [{ cookieAuth: [] }],
        response: {
          204: { type: 'null', description: 'No content' },
          401: errorSchema,
        },
      },
      preHandler: [isAuthenticated],
    },
    async (request, reply) => {
      await setTwoFactorMethod((request.user as User).id, 'EMAIL')
      return reply.code(204).send()
    },
  )

  // POST /auth/2fa/email/disable
  app.post(
    '/2fa/email/disable',
    {
      schema: {
        tags: ['auth'],
        summary: 'Disable email 2FA for the current user',
        security: [{ cookieAuth: [] }],
        response: {
          204: { type: 'null', description: 'No content' },
          401: errorSchema,
        },
      },
      preHandler: [isAuthenticated],
    },
    async (request, reply) => {
      await setTwoFactorMethod((request.user as User).id, null)
      return reply.code(204).send()
    },
  )

  // ─── TOTP management (authenticated) ───────────────────────────────────────

  // GET /auth/2fa/totp/setup
  app.get(
    '/2fa/totp/setup',
    {
      schema: {
        tags: ['auth'],
        summary: 'Generate a TOTP secret and otpauth URI (scan with authenticator app)',
        security: [{ cookieAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              secret: { type: 'string' },
              otpauthUri: { type: 'string' },
            },
            required: ['secret', 'otpauthUri'],
          },
          401: errorSchema,
        },
      },
      preHandler: [isAuthenticated],
    },
    async (request) => {
      return setupTotp((request.user as User).id)
    },
  )

  // POST /auth/2fa/totp/enable
  app.post<{ Body: { code: string } }>(
    '/2fa/totp/enable',
    {
      schema: {
        tags: ['auth'],
        summary: 'Confirm TOTP setup and enable it — returns one-time backup codes',
        security: [{ cookieAuth: [] }],
        body: {
          type: 'object',
          required: ['code'],
          properties: { code: { type: 'string', minLength: 6, maxLength: 6 } },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              backupCodes: { type: 'array', items: { type: 'string' } },
            },
            required: ['backupCodes'],
          },
          400: errorSchema,
          401: errorSchema,
        },
      },
      preHandler: [isAuthenticated],
    },
    async (request) => {
      const userId = (request.user as User).id
      const backupCodes = await enableTotp(userId, request.body.code)
      await setTwoFactorMethod(userId, 'TOTP')
      return { backupCodes }
    },
  )

  // POST /auth/2fa/totp/disable
  app.post<{ Body: { code: string } }>(
    '/2fa/totp/disable',
    {
      schema: {
        tags: ['auth'],
        summary: 'Disable TOTP — requires current TOTP code for confirmation',
        security: [{ cookieAuth: [] }],
        body: {
          type: 'object',
          required: ['code'],
          properties: { code: { type: 'string', minLength: 6, maxLength: 6 } },
        },
        response: {
          204: { type: 'null', description: 'No content' },
          400: errorSchema,
          401: errorSchema,
        },
      },
      preHandler: [isAuthenticated],
    },
    async (request, reply) => {
      const userId = (request.user as User).id
      await disableTotp(userId, request.body.code)
      await setTwoFactorMethod(userId, null)
      return reply.code(204).send()
    },
  )
}

export default twoFactorRoutes
