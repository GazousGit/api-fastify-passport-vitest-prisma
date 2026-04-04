import type { FastifyPluginAsync } from 'fastify'
import { authenticator } from '../../core/authenticator.js'
import { env } from '../../core/env.js'
import { oauthHandler } from './helpers/oauthHandler.js'

const microsoftRoutes: FastifyPluginAsync = async (app) => {
  if (!env.MICROSOFT_CLIENT_ID || !env.MICROSOFT_CLIENT_SECRET) {
    app.get('/microsoft', { schema: { tags: ['oauth-microsoft'], summary: 'Initiate Microsoft OAuth flow' } }, async (_request, reply) =>
      reply.code(501).send({ statusCode: 501, error: 'Not Implemented', message: 'Microsoft OAuth is not configured' }),
    )
    app.get('/microsoft/callback', { schema: { tags: ['oauth-microsoft'], summary: 'Microsoft OAuth callback' } }, async (_request, reply) =>
      reply.code(501).send({ statusCode: 501, error: 'Not Implemented', message: 'Microsoft OAuth is not configured' }),
    )
    return
  }

  app.get(
    '/microsoft',
    { schema: { tags: ['oauth-microsoft'], summary: 'Initiate Microsoft OAuth flow' } },
    oauthHandler(authenticator.authenticate('microsoft', { scope: ['user.read'] })),
  )

  app.get(
    '/microsoft/callback',
    { schema: { tags: ['oauth-microsoft'], summary: 'Microsoft OAuth callback' } },
    oauthHandler(
      authenticator.authenticate('microsoft', {
        failureRedirect: '/auth/login',
        successRedirect: '/',
      }),
    ),
  )
}

export default microsoftRoutes
