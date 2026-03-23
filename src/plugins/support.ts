import fp from 'fastify-plugin'
import { env } from '../core/env.js'
import { prisma } from '../core/prisma.js'

export default fp(async (app) => {
  // Expose the validated env config on every Fastify instance so that route
  // handlers can access app.config.PORT, app.config.NODE_ENV, etc. without
  // importing the env module directly.
  app.decorate('config', env)

  // Expose the shared Prisma client and register a shutdown hook so the
  // connection pool is cleanly drained when the server closes.
  app.decorate('prisma', prisma)
  app.addHook('onClose', async () => {
    await prisma.$disconnect()
  })
})

declare module 'fastify' {
  interface FastifyInstance {
    config: typeof env
    prisma: typeof prisma
  }
}
