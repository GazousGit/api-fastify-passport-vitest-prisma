import type { FastifyPluginAsync } from 'fastify'
import { authenticator } from '../../core/authenticator.js'
import { env } from '../../core/env.js'
import { oauthHandler } from './helpers/oauthHandler.js'

const paypalRoutes: FastifyPluginAsync = async (app) => {
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
    app.get('/paypal', { schema: { tags: ['oauth-paypal'], summary: 'Initiate PayPal OAuth flow' } }, async (_request, reply) =>
      reply.code(501).send({ statusCode: 501, error: 'Not Implemented', message: 'PayPal OAuth is not configured' }),
    )
    app.get('/paypal/callback', { schema: { tags: ['oauth-paypal'], summary: 'PayPal OAuth callback' } }, async (_request, reply) =>
      reply.code(501).send({ statusCode: 501, error: 'Not Implemented', message: 'PayPal OAuth is not configured' }),
    )
    return
  }

  app.get(
    '/paypal',
    { schema: { tags: ['oauth-paypal'], summary: 'Initiate PayPal OAuth flow' } },
    oauthHandler(authenticator.authenticate('paypal', { scope: ['openid', 'profile', 'email'] })),
  )

  app.get(
    '/paypal/callback',
    { schema: { tags: ['oauth-paypal'], summary: 'PayPal OAuth callback' } },
    oauthHandler(authenticator.authenticate('paypal', { failureRedirect: '/auth/login', successRedirect: '/' })),
  )
}

export default paypalRoutes
