import { it, expect, onTestFinished } from 'vitest'
import Fastify from 'fastify'
import request from 'supertest'
import rootRoutes from './root.js'

it('should return health status', async () => {
  const app = Fastify({ logger: false })
  await app.register(rootRoutes)
  await app.ready()
  onTestFinished(() => app.close())

  const res = await request(app.server).get('/health')
  expect(res.status).toBe(200)
  expect(res.body).toEqual({ status: 'ok' })
})
