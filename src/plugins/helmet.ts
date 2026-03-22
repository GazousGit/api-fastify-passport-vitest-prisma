import fp from 'fastify-plugin'
import helmet from '@fastify/helmet'
import type { FastifyHelmetOptions } from '@fastify/helmet'

/**
 * This plugins adds important security headers with helmet
 *
 * @see https://github.com/fastify/fastify-helmet
 */
export default fp<FastifyHelmetOptions>(async (app) => {
  app.register(helmet, {
    // Apply helmet headers to all routes, including those registered before this plugin
    global: true,

    // Strict Transport Security: force HTTPS for 1 year, include subdomains
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },

    // Content Security Policy: tighten for a pure API (no HTML served)
    // TODO, this is important to properly set this while scaling the app
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },

    // Prevent browsers from MIME-sniffing the response content-type
    noSniff: true,

    // Block the response from being embedded in an iframe (also covered by CSP above)
    frameguard: { action: 'deny' },

    // Remove the X-Powered-By header (avoid leaking server info)
    hidePoweredBy: true,

    // Disable the legacy X-XSS-Protection header — modern browsers ignore it
    // and it can introduce vulnerabilities in older IE versions
    xssFilter: false,

    // Referrer-Policy: only send the origin, never the full URL
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

    // Disable DNS prefetching to reduce info leakage
    dnsPrefetchControl: { allow: false },

    // Disable cross-origin resource sharing at the browser level
    crossOriginResourcePolicy: { policy: 'same-origin' },

    // Prevent cross-origin requests from reading the response (CORS is handled separately)
    crossOriginOpenerPolicy: { policy: 'same-origin' },
  })
})
