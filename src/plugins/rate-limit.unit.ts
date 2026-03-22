import { describe, it, expect } from 'vitest'
import Fastify from 'fastify'
import { onTestFinished } from 'vitest'
import rateLimitPlugin from './rate-limit.js'

async function build() {
  const app = Fastify({ logger: false })
  app.register(rateLimitPlugin)
  app.get('/test', async () => ({ ok: true }))
  await app.ready()
  onTestFinished(() => app.close())
  return app
}

describe('plugins -> rate-limit', () => {
  it('should add X-RateLimit-Limit header with the configured max', async () => {
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/test' })
    expect(res.headers['x-ratelimit-limit']).toBe('100')
  })

  it('should add X-RateLimit-Remaining header', async () => {
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/test' })
    const remaining = Number(res.headers['x-ratelimit-remaining'])
    expect(remaining).toBeGreaterThanOrEqual(0)
    expect(remaining).toBeLessThan(100)
  })

  it('should add X-RateLimit-Reset header', async () => {
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/test' })
    expect(res.headers['x-ratelimit-reset']).toBeDefined()
  })

  it('should decrease X-RateLimit-Remaining on successive requests', async () => {
    const app = await build()

    const first = await app.inject({ method: 'GET', url: '/test' })
    const second = await app.inject({ method: 'GET', url: '/test' })

    const remainingAfterFirst = Number(first.headers['x-ratelimit-remaining'])
    const remainingAfterSecond = Number(second.headers['x-ratelimit-remaining'])
    expect(remainingAfterSecond).toBe(remainingAfterFirst - 1)
  })

  it('should return 200 for a normal request (not rate limited)', async () => {
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/test' })
    expect(res.statusCode).toBe(200)
  })
})
