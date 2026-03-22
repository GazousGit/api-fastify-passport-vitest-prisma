import { vi, describe, it, expect, afterEach } from 'vitest'
import Fastify from 'fastify'
import { onTestFinished } from 'vitest'
import corsPlugin from './cors.js'

afterEach(() => vi.unstubAllEnvs())

async function build() {
  const app = Fastify({ logger: false })
  app.register(corsPlugin)
  app.get('/test', async () => ({ ok: true }))
  await app.ready()
  onTestFinished(() => app.close())
  return app
}

describe('plugins -> cors ', () => {
  describe('no ALLOWED_ORIGIN', () => {
    it('should not set Access-Control-Allow-Origin when origin is disabled', async () => {
      vi.stubEnv('ALLOWED_ORIGIN', '')
      const app = await build()

      const res = await app.inject({
        method: 'GET',
        url: '/test',
        headers: { origin: 'https://evil.com' },
      })

      expect(res.headers['access-control-allow-origin']).toBeUndefined()
    })
  })

  describe('with ALLOWED_ORIGIN', () => {
    it('should reflect the allowed origin in the response header', async () => {
      vi.stubEnv('ALLOWED_ORIGIN', 'https://app.example.com')
      const app = await build()

      const res = await app.inject({
        method: 'GET',
        url: '/test',
        headers: { origin: 'https://app.example.com' },
      })

      expect(res.headers['access-control-allow-origin']).toBe('https://app.example.com')
    })

    it('should include Access-Control-Allow-Credentials', async () => {
      vi.stubEnv('ALLOWED_ORIGIN', 'https://app.example.com')
      const app = await build()

      const res = await app.inject({
        method: 'GET',
        url: '/test',
        headers: { origin: 'https://app.example.com' },
      })

      expect(res.headers['access-control-allow-credentials']).toBe('true')
    })

    it('should handle OPTIONS preflight and returns 204 with allowed methods', async () => {
      vi.stubEnv('ALLOWED_ORIGIN', 'https://app.example.com')
      const app = await build()

      const res = await app.inject({
        method: 'OPTIONS',
        url: '/test',
        headers: {
          origin: 'https://app.example.com',
          'access-control-request-method': 'POST',
        },
      })

      expect(res.statusCode).toBe(204)
      const allowedMethods = res.headers['access-control-allow-methods'] as string
      expect(allowedMethods).toContain('GET')
      expect(allowedMethods).toContain('POST')
      expect(allowedMethods).toContain('DELETE')
    })

    it('should expose X-Request-Id in Access-Control-Expose-Headers', async () => {
      vi.stubEnv('ALLOWED_ORIGIN', 'https://app.example.com')
      const app = await build()

      const res = await app.inject({
        method: 'GET',
        url: '/test',
        headers: { origin: 'https://app.example.com' },
      })

      expect(res.headers['access-control-expose-headers']).toContain('X-Request-Id')
    })
  })
})
