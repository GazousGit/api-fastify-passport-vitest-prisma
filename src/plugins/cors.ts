import fp from 'fastify-plugin'
import cors from '@fastify/cors'
import type { FastifyCorsOptions } from '@fastify/cors'

/**
 * This plugins enables the use of CORS in a Fastify application
 *
 * @see https://github.com/fastify/fastify-cors
 */
export default fp<FastifyCorsOptions>(async (app) => {
  app.register(cors, {
    // Restrict to explicit origin(s) — set ALLOWED_ORIGIN in your environment.
    // Never use `true` in production: it reflects the request Origin back,
    // which bypasses the protection CORS is meant to provide.
    origin: process.env.ALLOWED_ORIGIN ?? false,

    // Only expose the methods your API actually uses
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],

    // Headers clients are allowed to send
    allowedHeaders: ['Content-Type', 'Authorization'],

    // Headers the browser is allowed to read from the response
    exposedHeaders: ['X-Request-Id'],

    // Allow cookies / Authorization headers in cross-origin requests.
    // Requires `origin` to be a specific value, not `true` or a wildcard.
    credentials: true,

    // How long (seconds) the browser can cache a preflight response (24 h)
    maxAge: 86400,
  })
})
