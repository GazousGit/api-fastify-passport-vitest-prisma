import type { FastifyPluginAsync } from 'fastify'
import { authenticator } from '../../core/authenticator.js'
import { env } from '../../core/env.js'
import { oauthHandler } from './helpers/oauthHandler.js'

const facebookRoutes: FastifyPluginAsync = async (app) => {
  if (!env.FACEBOOK_CLIENT_ID || !env.FACEBOOK_CLIENT_SECRET) {
    app.get('/facebook', async (_request, reply) =>
      reply.code(501).send({ statusCode: 501, error: 'Not Implemented', message: 'Facebook OAuth is not configured' }),
    )
    app.get('/facebook/callback', async (_request, reply) =>
      reply.code(501).send({ statusCode: 501, error: 'Not Implemented', message: 'Facebook OAuth is not configured' }),
    )
    return
  }

  app.get(
    '/facebook',
    { schema: { tags: ['auth'], summary: 'Initiate Facebook OAuth flow' } },
    oauthHandler(authenticator.authenticate('facebook', { scope: ['email'] })),
  )

  app.get(
    '/facebook/callback',
    { schema: { tags: ['auth'], summary: 'Facebook OAuth callback' } },
    oauthHandler(authenticator.authenticate('facebook', { failureRedirect: '/auth/login', successRedirect: '/' })),
  )
}

export default facebookRoutes
