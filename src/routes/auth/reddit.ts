import type { FastifyPluginAsync } from 'fastify'
import { authenticator } from '../../core/authenticator.js'
import { env } from '../../core/env.js'
import { oauthHandler } from './helpers/oauthHandler.js'

const redditRoutes: FastifyPluginAsync = async (app) => {
  if (!env.REDDIT_CLIENT_ID || !env.REDDIT_CLIENT_SECRET) {
    app.get('/reddit', { schema: { tags: ['oauth-reddit'], summary: 'Initiate Reddit OAuth flow' } }, async (_request, reply) =>
      reply.code(501).send({ statusCode: 501, error: 'Not Implemented', message: 'Reddit OAuth is not configured' }),
    )
    app.get('/reddit/callback', { schema: { tags: ['oauth-reddit'], summary: 'Reddit OAuth callback' } }, async (_request, reply) =>
      reply.code(501).send({ statusCode: 501, error: 'Not Implemented', message: 'Reddit OAuth is not configured' }),
    )
    return
  }

  app.get(
    '/reddit',
    { schema: { tags: ['oauth-reddit'], summary: 'Initiate Reddit OAuth flow' } },
    oauthHandler(authenticator.authenticate('reddit', { scope: ['identity'] })),
  )

  app.get(
    '/reddit/callback',
    { schema: { tags: ['oauth-reddit'], summary: 'Reddit OAuth callback' } },
    oauthHandler(authenticator.authenticate('reddit', { failureRedirect: '/auth/login', successRedirect: '/' })),
  )
}

export default redditRoutes
