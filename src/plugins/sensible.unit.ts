import { describe, it, expect } from 'vitest'
import Fastify from 'fastify'
import { onTestFinished } from 'vitest'
import sensiblePlugin from './sensible.js'

async function build() {
  const app = Fastify({ logger: false })
  app.register(sensiblePlugin)
  await app.ready()
  onTestFinished(() => app.close())
  return app
}

describe('plugins -> sensible', () => {
  it('should decorate the instance with httpErrors', async () => {
    const app = await build()
    expect(app.httpErrors).toBeDefined()
  })

  it('should provide common HTTP error factories on httpErrors', async () => {
    const app = await build()
    expect(typeof app.httpErrors.badRequest).toBe('function')
    expect(typeof app.httpErrors.unauthorized).toBe('function')
    expect(typeof app.httpErrors.forbidden).toBe('function')
    expect(typeof app.httpErrors.notFound).toBe('function')
    expect(typeof app.httpErrors.internalServerError).toBe('function')
  })

  it('should make httpErrors.notFound() produces a 404 error', async () => {
    const app = await build()
    const err = app.httpErrors.notFound('thing not found')
    expect(err.statusCode).toBe(404)
    expect(err.message).toBe('thing not found')
  })

  it('should make httpErrors.badRequest() produces a 400 error', async () => {
    const app = await build()
    const err = app.httpErrors.badRequest('invalid input')
    expect(err.statusCode).toBe(400)
  })

  it('should make reply.notFound() responds with 404', async () => {
    const app = Fastify({ logger: false })
    app.register(sensiblePlugin)
    app.get('/test', async (_req, reply) => reply.notFound())
    await app.ready()
    onTestFinished(() => app.close())

    const res = await app.inject({ method: 'GET', url: '/test' })
    expect(res.statusCode).toBe(404)
  })

  it('should make reply.internalServerError() responds with 500', async () => {
    const app = Fastify({ logger: false })
    app.register(sensiblePlugin)
    app.get('/test', async (_req, reply) => reply.internalServerError())
    await app.ready()
    onTestFinished(() => app.close())

    const res = await app.inject({ method: 'GET', url: '/test' })
    expect(res.statusCode).toBe(500)
  })
})
