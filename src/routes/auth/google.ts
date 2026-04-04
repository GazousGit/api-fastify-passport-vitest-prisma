import type { FastifyPluginAsync } from 'fastify'
import { authenticator } from '../../core/authenticator.js'
import { env } from '../../core/env.js'
import { oauthHandler } from './helpers/oauthHandler.js'

const googleRoutes: FastifyPluginAsync = async (app) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    app.get('/google', async (_request, reply) =>
      reply.code(501).send({ statusCode: 501, error: 'Not Implemented', message: 'Google OAuth is not configured' }),
    )
    app.get('/google/callback', async (_request, reply) =>
      reply.code(501).send({ statusCode: 501, error: 'Not Implemented', message: 'Google OAuth is not configured' }),
    )
    return
  }

  app.get(
    '/google',
    { schema: { tags: ['oauth-google'], summary: 'Initiate Google OAuth flow' } },
    oauthHandler(authenticator.authenticate('google', { scope: ['email', 'profile'] })),
  )

  app.get(
    '/google/callback',
    { schema: { tags: ['oauth-google'], summary: 'Google OAuth callback' } },
    oauthHandler(authenticator.authenticate('google', { failureRedirect: '/auth/login', successRedirect: '/' })),
  )
}

export default googleRoutes
