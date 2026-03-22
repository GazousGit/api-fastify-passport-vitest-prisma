import type { FastifyPluginAsync } from 'fastify'

const rootRoutes: FastifyPluginAsync = async (app): Promise<void> => {
  app.get('/health', async function () {
    return { status: 'ok' }
  })
}

export default rootRoutes
