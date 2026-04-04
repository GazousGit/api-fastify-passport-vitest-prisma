import fp from 'fastify-plugin'
import swagger from '@fastify/swagger'
import type { OpenAPIV3 } from 'openapi-types'
import scalarApiReference from '@scalar/fastify-api-reference'

const oauthProviders = [
  { name: 'oauth-google',    description: 'Google OAuth 2.0' },
  { name: 'oauth-github',    description: 'GitHub OAuth 2.0' },
  { name: 'oauth-facebook',  description: 'Facebook OAuth 2.0' },
  { name: 'oauth-twitter',   description: 'Twitter / X OAuth 2.0' },
  { name: 'oauth-discord',   description: 'Discord OAuth 2.0' },
  { name: 'oauth-amazon',    description: 'Amazon OAuth 2.0' },
  { name: 'oauth-apple',     description: 'Apple Sign In' },
  { name: 'oauth-microsoft', description: 'Microsoft OAuth 2.0' },
  { name: 'oauth-reddit',    description: 'Reddit OAuth 2.0' },
  { name: 'oauth-paypal',    description: 'PayPal OAuth 2.0' },
  { name: 'oauth-linkedin',  description: 'LinkedIn OAuth 2.0' },
]

export default fp(async (app) => {
  await app.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'API',
        description: 'Fastify REST API boilerplate',
        version: '1.0.0',
      },
      tags: [
        { name: 'auth',     description: 'Local authentication (email / password, session)' },
        { name: 'api-keys', description: 'API key management (Admin only except creation)' },
        ...oauthProviders,
      ],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'sessionId',
            description: 'Session cookie obtained after login',
          },
          apiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'Authorization',
            description: 'API key authentication. Header format: `ApiKey <key>`',
          },
        },
      },
      // x-tagGroups is a Scalar/Redoc extension — not in the OpenAPI types, cast required
      ...({
        'x-tagGroups': [
          {
            name: 'Users',
            tags: ['users'],
          },
          {
            name: 'Auth',
            tags: ['auth', ...oauthProviders.map((p) => p.name)],
          },
          {
            name: 'API Keys',
            tags: ['api-keys'],
          },
        ],
      } as object),
    } as Partial<OpenAPIV3.Document>,
  })

  await app.register(scalarApiReference, {
    routePrefix: '/docs',
  })

  app.addHook('onSend', async (request, reply) => {
    if (request.url.startsWith('/docs')) {
      reply.header(
        'content-security-policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src * data: blob:; font-src * data:; connect-src *",
      )
    }
  })
})
