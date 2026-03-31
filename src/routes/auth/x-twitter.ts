import type { FastifyPluginAsync } from 'fastify'
import { authenticator } from '../../core/authenticator.js'
import { env } from '../../core/env.js'
import { oauthHandler } from './helpers/oauthHandler.js'

const twitterRoutes: FastifyPluginAsync = async (app) => {
  if (!env.TWITTER_CLIENT_ID || !env.TWITTER_CLIENT_SECRET) {
    app.get('/x-twitter', async (_request, reply) =>
      reply.code(501).send({ statusCode: 501, error: 'Not Implemented', message: 'Twitter OAuth is not configured' }),
    )
    app.get('/x-twitter/callback', async (_request, reply) =>
      reply.code(501).send({ statusCode: 501, error: 'Not Implemented', message: 'Twitter OAuth is not configured' }),
    )
    return
  }

  app.get(
    '/x-twitter',
    { schema: { tags: ['auth'], summary: 'Initiate Twitter/X OAuth flow' } },
    oauthHandler(authenticator.authenticate('twitter')),
  )

  app.get(
    '/x-twitter/callback',
    { schema: { tags: ['auth'], summary: 'Twitter/X OAuth callback' } },
    oauthHandler(authenticator.authenticate('twitter', { failureRedirect: '/auth/login', successRedirect: '/' })),
  )
}

export default twitterRoutes
