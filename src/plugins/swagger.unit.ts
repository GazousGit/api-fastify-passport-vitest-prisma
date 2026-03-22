import { describe, it, expect } from 'vitest'
import Fastify from 'fastify'
import { onTestFinished } from 'vitest'
import swaggerPlugin from './swagger.js'

async function build() {
  const app = Fastify({ logger: false })
  await app.register(swaggerPlugin)
  await app.ready()
  onTestFinished(() => app.close())
  return app
}

describe('plugins -> swagger', () => {
  it('should decorate the instance with swagger()', async () => {
    const app = await build()
    expect(typeof app.swagger).toBe('function')
  })

  it('should serve the Scalar docs UI at /docs', async () => {
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/docs' })
    expect(res.statusCode).toBe(200)
  })

  it('should expose an OpenAPI spec with the correct info', async () => {
    const app = await build()
    const spec = app.swagger()
    expect(spec.info.title).toBe('API')
    expect(spec.info.version).toBe('1.0.0')
  })

  it('should define the users tag', async () => {
    const app = await build()
    const spec = app.swagger()
    expect(spec.tags).toContainEqual(expect.objectContaining({ name: 'users' }))
  })
})
