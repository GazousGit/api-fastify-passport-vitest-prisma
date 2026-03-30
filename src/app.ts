import { fileURLToPath } from 'node:url'
import './core/env.js'
import AutoLoad from '@fastify/autoload'
import type { AutoloadPluginOptions } from '@fastify/autoload'
import type { FastifyPluginAsync, FastifyServerOptions } from 'fastify'
import { loggerOptions } from './core/logger.js'
import { errorHandler } from './core/errors/index.js'

export interface AppOptions extends FastifyServerOptions, Partial<AutoloadPluginOptions> {}

export const options: AppOptions = {
  logger: loggerOptions,
}

const app: FastifyPluginAsync<AppOptions> = async (fastify, opts): Promise<void> => {
  await fastify.register(errorHandler)

  await fastify.register(AutoLoad, {
    dir: fileURLToPath(new URL('./plugins', import.meta.url)),
    options: opts,
    ignorePattern: /\.(unit|spec|integration)\.(ts|js)$/,
  })

  await fastify.register(AutoLoad, {
    dir: fileURLToPath(new URL('./routes', import.meta.url)),
    options: opts,
    ignorePattern: /\.(unit|spec|integration)\.(ts|js)$/,
  })
}

export default app
