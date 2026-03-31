import fp from 'fastify-plugin'
import fastifyCookie from '@fastify/cookie'
import fastifySession from '@fastify/session'
import { authenticator } from '../core/authenticator.js'
import { RedisStore } from 'connect-redis'
import { env } from '../core/env.js'
import { redis } from '../core/redis.js'
import { prisma } from '../core/prisma.js'
import type { User } from '../modules/user/type.js'
import { setupGoogleStrategy } from '../modules/auth/strategies/google.js'
import { setupGithubStrategy } from '../modules/auth/strategies/github.js'
import { setupFacebookStrategy } from '../modules/auth/strategies/facebook.js'
import { setupTwitterStrategy } from '../modules/auth/strategies/x-twitter.js'
import { setupDiscordStrategy } from '../modules/auth/strategies/discord.js'

// Plugin order matters: cookie → session → passport
// Wrapped in a single fp() to guarantee sequential registration
export default fp(async (app) => {
  if (!redis.isOpen) await redis.connect()

  app.decorate('redis', redis)
  app.addHook('onClose', async () => {
    await redis.quit()
  })

  await app.register(fastifyCookie)

  await app.register(fastifySession, {
    secret: env.SESSION_SECRET,
    store: new RedisStore({ client: redis }),
    cookie: {
      secure: env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
    saveUninitialized: false,
  })

  await app.register(authenticator.initialize())
  await app.register(authenticator.secureSession())

  authenticator.registerUserSerializer<User, string>(async (user) => user.id)

  authenticator.registerUserDeserializer<string, User | null>(async (id) => {
    return prisma.user.findUnique({ where: { id } })
  })

  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    setupGoogleStrategy()
  }

  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
    setupGithubStrategy()
  }

  if (env.FACEBOOK_CLIENT_ID && env.FACEBOOK_CLIENT_SECRET) {
    setupFacebookStrategy()
  }

  if (env.TWITTER_CLIENT_ID && env.TWITTER_CLIENT_SECRET) {
    setupTwitterStrategy()
  }

  if (env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET) {
    setupDiscordStrategy()
  }
})

declare module 'fastify' {
  interface FastifyInstance {
    redis: typeof redis
  }
}
