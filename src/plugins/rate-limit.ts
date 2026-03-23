import fp from 'fastify-plugin'
import rateLimit from '@fastify/rate-limit'
import type { FastifyRateLimitOptions } from '@fastify/rate-limit'

/**
 * This plugins adds a low overhead rate limiter for your routes
 *
 * @see https://github.com/fastify/fastify-rate-limit
 */
export default fp<FastifyRateLimitOptions>(async (app) => {
  await app.register(rateLimit, {
    // Maximum requests per window per IP
    max: 100,

    // Time window in milliseconds (1 minute)
    timeWindow: 60_000,

    // Return 429 instead of the default Fastify error shape
    errorResponseBuilder: (_request, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${context.after}.`,
    }),

    // Add rate limit headers to every response so clients can self-throttle:
    // X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
    addHeadersOnExceeding: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },

    // Apply to all routes by default; opt out per-route with config: { rateLimit: false }
    global: true,
  })
})