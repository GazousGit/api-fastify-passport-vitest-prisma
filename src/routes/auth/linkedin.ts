import type { FastifyPluginAsync } from 'fastify'
import { authenticator } from '../../core/authenticator.js'
import { env } from '../../core/env.js'
import { oauthHandler } from './helpers/oauthHandler.js'

const linkedinRoutes: FastifyPluginAsync = async (app) => {
  if (!env.LINKEDIN_CLIENT_ID || !env.LINKEDIN_CLIENT_SECRET) {
    app.get('/linkedin', { schema: { tags: ['oauth-linkedin'], summary: 'Initiate LinkedIn OAuth flow' } }, async (_request, reply) =>
      reply.code(501).send({ statusCode: 501, error: 'Not Implemented', message: 'LinkedIn OAuth is not configured' }),
    )
    app.get('/linkedin/callback', { schema: { tags: ['oauth-linkedin'], summary: 'LinkedIn OAuth callback' } }, async (_request, reply) =>
      reply.code(501).send({ statusCode: 501, error: 'Not Implemented', message: 'LinkedIn OAuth is not configured' }),
    )
    return
  }

  app.get(
    '/linkedin',
    { schema: { tags: ['oauth-linkedin'], summary: 'Initiate LinkedIn OAuth flow' } },
    oauthHandler(authenticator.authenticate('linkedin', { scope: ['openid', 'profile', 'email'] })),
  )

  app.get(
    '/linkedin/callback',
    { schema: { tags: ['oauth-linkedin'], summary: 'LinkedIn OAuth callback' } },
    oauthHandler(authenticator.authenticate('linkedin', { failureRedirect: '/auth/login', successRedirect: '/' })),
  )
}

export default linkedinRoutes
