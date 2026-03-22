import { it, expect, describe } from 'vitest'
import Fastify from 'fastify'
import Support from './support.js'

describe('plugins -> support', () => {
  it('should decorate config and prisma', async () => {
    const fastify = Fastify()
    void fastify.register(Support)
    await fastify.ready()

    expect(fastify.config).toBeDefined()
    expect(typeof fastify.config.PORT).toBe('number')
    expect(fastify.prisma).toBeDefined()
    expect(typeof fastify.prisma.user.findMany).toBe('function')

    await fastify.close()
  })
})
