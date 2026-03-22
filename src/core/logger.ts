import { env } from './env.js'
import type { FastifyServerOptions } from 'fastify'

const isDev = env.NODE_ENV === 'development'

export const loggerOptions: FastifyServerOptions['logger'] = {
  level: env.LOG_LEVEL,

  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          singleLine: false,
          messageKey: 'msg',
        },
      }
    : undefined,

  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.token',
      'req.body.secret',
      '*.password',
      '*.token',
      '*.secret',
      '*.creditCard',
      '*.ssn',
    ],
    censor: '[REDACTED]',
  },

  serializers: {
    req(request) {
      return {
        method: request.method,
        url: request.url,
        hostname: request.hostname,
        remoteAddress: request.ip,
        requestId: request.id,
      }
    },
    res(reply) {
      return {
        statusCode: reply.statusCode,
      }
    },
    err(error) {
      return {
        type: error.constructor?.name ?? 'Error',
        message: error.message,
        stack: error.stack ?? '',
        code: (error as NodeJS.ErrnoException).code,
      }
    },
  },
}
