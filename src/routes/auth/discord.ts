import type { FastifyPluginAsync } from 'fastify'
import { authenticator } from '../../core/authenticator.js'
import { env } from '../../core/env.js'
import { oauthHandler } from './helpers/oauthHandler.js'

const discordRoutes: FastifyPluginAsync = async (app) => {
  if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET) {
    app.get('/discord', { schema: { tags: ['oauth-discord'], summary: 'Initiate Discord OAuth flow' } }, async (_request, reply) =>
      reply.code(501).send({ statusCode: 501, error: 'Not Implemented', message: 'Discord OAuth is not configured' }),
    )
    app.get('/discord/callback', { schema: { tags: ['oauth-discord'], summary: 'Discord OAuth callback' } }, async (_request, reply) =>
      reply.code(501).send({ statusCode: 501, error: 'Not Implemented', message: 'Discord OAuth is not configured' }),
    )
    return
  }

  app.get(
    '/discord',
    { schema: { tags: ['oauth-discord'], summary: 'Initiate Discord OAuth flow' } },
    oauthHandler(authenticator.authenticate('discord', { scope: ['identify', 'email'] })),
  )

  app.get(
    '/discord/callback',
    { schema: { tags: ['oauth-discord'], summary: 'Discord OAuth callback' } },
    oauthHandler(authenticator.authenticate('discord', { failureRedirect: '/auth/login', successRedirect: '/' })),
  )
}

export default discordRoutes
