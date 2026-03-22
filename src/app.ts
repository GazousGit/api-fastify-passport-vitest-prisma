import { fileURLToPath } from 'node:url'
import './core/env.js' // validate environment variables at startup
import AutoLoad from '@fastify/autoload'
import type { AutoloadPluginOptions } from '@fastify/autoload'
import type { FastifyPluginAsync, FastifyServerOptions } from 'fastify'
import { loggerOptions } from './core/logger.js'
import { errorHandler } from './core/errors/index.js'

export interface AppOptions extends FastifyServerOptions, Partial<AutoloadPluginOptions> {}

// Options are consumed by fastify-cli when starting the server.
// loggerOptions is also used directly when calling Fastify() in code.
export const options: AppOptions = {
  logger: loggerOptions,
}

const app: FastifyPluginAsync<AppOptions> = async (fastify, opts): Promise<void> => {
  // Global error handler — must be registered before routes
  await fastify.register(errorHandler)

  // Plugins (support utilities shared across routes)
  void fastify.register(AutoLoad, {
    dir: fileURLToPath(new URL('./plugins', import.meta.url)),
    options: opts,
  })

  // Routes
  void fastify.register(AutoLoad, {
    dir: fileURLToPath(new URL('./routes', import.meta.url)),
    options: opts,
  })
}

export default app
export { app }
