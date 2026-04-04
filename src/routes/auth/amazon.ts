import type { FastifyPluginAsync } from 'fastify'
import { authenticator } from '../../core/authenticator.js'
import { env } from '../../core/env.js'
import { oauthHandler } from './helpers/oauthHandler.js'

const amazonRoutes: FastifyPluginAsync = async (app) => {
  if (!env.AMAZON_CLIENT_ID || !env.AMAZON_CLIENT_SECRET) {
    app.get('/amazon', { schema: { tags: ['oauth-amazon'], summary: 'Initiate Amazon OAuth flow' } }, async (_request, reply) =>
      reply.code(501).send({ statusCode: 501, error: 'Not Implemented', message: 'Amazon OAuth is not configured' }),
    )
    app.get('/amazon/callback', { schema: { tags: ['oauth-amazon'], summary: 'Amazon OAuth callback' } }, async (_request, reply) =>
      reply.code(501).send({ statusCode: 501, error: 'Not Implemented', message: 'Amazon OAuth is not configured' }),
    )
    return
  }

  app.get(
    '/amazon',
    { schema: { tags: ['oauth-amazon'], summary: 'Initiate Amazon OAuth flow' } },
    oauthHandler(authenticator.authenticate('amazon', { scope: ['profile'] })),
  )

  app.get(
    '/amazon/callback',
    { schema: { tags: ['oauth-amazon'], summary: 'Amazon OAuth callback' } },
    oauthHandler(authenticator.authenticate('amazon', { failureRedirect: '/auth/login', successRedirect: '/' })),
  )
}

export default amazonRoutes
