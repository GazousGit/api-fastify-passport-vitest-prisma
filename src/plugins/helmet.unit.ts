import { describe, it, expect } from 'vitest'
import Fastify from 'fastify'
import { onTestFinished } from 'vitest'
import helmetPlugin from './helmet.js'

async function build() {
  const app = Fastify({ logger: false })
  app.register(helmetPlugin)
  app.get('/test', async () => ({ ok: true }))
  await app.ready()
  onTestFinished(() => app.close())
  return app
}

describe('plugins -> helmet', () => {
  it('should set X-Content-Type-Options: nosniff', async () => {
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/test' })
    expect(res.headers['x-content-type-options']).toBe('nosniff')
  })

  it('should set X-Frame-Options: DENY', async () => {
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/test' })
    expect(res.headers['x-frame-options']).toBe('DENY')
  })

  it('should set Strict-Transport-Security with 1-year max-age, subdomains and preload', async () => {
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/test' })
    const hsts = res.headers['strict-transport-security'] as string
    expect(hsts).toContain('max-age=31536000')
    expect(hsts).toContain('includeSubDomains')
    expect(hsts).toContain('preload')
  })

  it('should set Content-Security-Policy with default-src and frame-ancestors none', async () => {
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/test' })
    const csp = res.headers['content-security-policy'] as string
    expect(csp).toContain("default-src 'none'")
    expect(csp).toContain("frame-ancestors 'none'")
  })

  it('should set Referrer-Policy: strict-origin-when-cross-origin', async () => {
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/test' })
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
  })

  it('should remove X-Powered-By', async () => {
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/test' })
    expect(res.headers['x-powered-by']).toBeUndefined()
  })

  it('should not set X-XSS-Protection (explicitly disabled)', async () => {
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/test' })
    expect(res.headers['x-xss-protection']).toBeUndefined()
  })

  it('should set Cross-Origin-Resource-Policy: same-origin', async () => {
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/test' })
    expect(res.headers['cross-origin-resource-policy']).toBe('same-origin')
  })

  it('should set Cross-Origin-Opener-Policy: same-origin', async () => {
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/test' })
    expect(res.headers['cross-origin-opener-policy']).toBe('same-origin')
  })
})
