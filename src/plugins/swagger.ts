import fp from 'fastify-plugin'
import swagger from '@fastify/swagger'
import scalarApiReference from '@scalar/fastify-api-reference'

export default fp(async (app) => {
  await app.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'API',
        description: 'Fastify REST API boilerplate',
        version: '1.0.0',
      },
      tags: [{ name: 'users', description: 'User endpoints' }],
    },
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
