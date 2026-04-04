import type { FastifyPluginAsync } from 'fastify'
import { authenticator } from '../../core/authenticator.js'
import { env } from '../../core/env.js'
import { oauthHandler } from './helpers/oauthHandler.js'

const appleRoutes: FastifyPluginAsync = async (app) => {
  if (!env.APPLE_CLIENT_ID || !env.APPLE_TEAM_ID || !env.APPLE_KEY_ID || !env.APPLE_PRIVATE_KEY) {
    app.get('/apple', { schema: { tags: ['oauth-apple'], summary: 'Initiate Apple OAuth flow' } }, async (_request, reply) =>
      reply.code(501).send({ statusCode: 501, error: 'Not Implemented', message: 'Apple OAuth is not configured' }),
    )
    app.post('/apple/callback', { schema: { tags: ['oauth-apple'], summary: 'Apple OAuth callback' } }, async (_request, reply) =>
      reply.code(501).send({ statusCode: 501, error: 'Not Implemented', message: 'Apple OAuth is not configured' }),
    )
    return
  }

  app.get(
    '/apple',
    { schema: { tags: ['oauth-apple'], summary: 'Initiate Apple OAuth flow' } },
    oauthHandler(authenticator.authenticate('apple', { scope: ['name', 'email'] })),
  )

  // Apple sends the callback as a POST (form_post response mode)
  app.post(
    '/apple/callback',
    { schema: { tags: ['oauth-apple'], summary: 'Apple OAuth callback' } },
    oauthHandler(authenticator.authenticate('apple', { failureRedirect: '/auth/login', successRedirect: '/' })),
  )
}

export default appleRoutes
