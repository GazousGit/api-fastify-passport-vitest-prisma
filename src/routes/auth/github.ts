import type { FastifyPluginAsync } from 'fastify'
import { authenticator } from '../../core/authenticator.js'
import { env } from '../../core/env.js'
import { oauthHandler } from './helpers/oauthHandler.js'

const githubRoutes: FastifyPluginAsync = async (app) => {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    app.get('/github', { schema: { tags: ['oauth-github'], summary: 'Initiate GitHub OAuth flow' } }, async (_request, reply) =>
      reply.code(501).send({ statusCode: 501, error: 'Not Implemented', message: 'GitHub OAuth is not configured' }),
    )
    app.get('/github/callback', { schema: { tags: ['oauth-github'], summary: 'GitHub OAuth callback' } }, async (_request, reply) =>
      reply.code(501).send({ statusCode: 501, error: 'Not Implemented', message: 'GitHub OAuth is not configured' }),
    )
    return
  }

  app.get(
    '/github',
    { schema: { tags: ['oauth-github'], summary: 'Initiate GitHub OAuth flow' } },
    oauthHandler(authenticator.authenticate('github', { scope: ['user:email'] })),
  )

  app.get(
    '/github/callback',
    { schema: { tags: ['oauth-github'], summary: 'GitHub OAuth callback' } },
    oauthHandler(authenticator.authenticate('github', { failureRedirect: '/auth/login', successRedirect: '/' })),
  )
}

export default githubRoutes
