import Fastify from 'fastify'
import fp from 'fastify-plugin'
import { onTestFinished } from 'vitest'
import App from '../src/app.js'

async function build() {
  const app = Fastify({ logger: false })
  await app.register(fp(App))
  await app.ready()
  onTestFinished(() => app.close())
  return app
}

export { build }
