import fp from 'fastify-plugin'
import fastifySecureSession from '@fastify/secure-session'
import { authenticator } from '../core/authenticator.js'
import { env } from '../core/env.js'
import { redis } from '../core/redis.js'
import { prisma } from '../core/prisma.js'
import type { User } from '../modules/user/type.js'
import { setupGoogleStrategy } from '../modules/auth/strategies/google.js'
import { setupGithubStrategy } from '../modules/auth/strategies/github.js'
import { setupFacebookStrategy } from '../modules/auth/strategies/facebook.js'
import { setupTwitterStrategy } from '../modules/auth/strategies/x-twitter.js'
import { setupDiscordStrategy } from '../modules/auth/strategies/discord.js'
import { setupAmazonStrategy } from '../modules/auth/strategies/amazon.js'
import { setupAppleStrategy } from '../modules/auth/strategies/apple.js'
import { setupMicrosoftStrategy } from '../modules/auth/strategies/microsoft.js'
import { setupRedditStrategy } from '../modules/auth/strategies/reddit.js'
import { setupPayPalStrategy } from '../modules/auth/strategies/paypal.js'
import { setupLinkedInStrategy } from '../modules/auth/strategies/linkedin.js'

// Plugin order matters: secure-session → passport
// Wrapped in a single fp() to guarantee sequential registration
export default fp(async (app) => {
  if (!redis.isOpen) await redis.connect()

  app.decorate('redis', redis)
  app.addHook('onClose', async () => {
    await redis.quit()
  })

  await app.register(fastifySecureSession, {
    secret: env.SESSION_SECRET,
    salt: env.SESSION_SALT,
    cookie: {
      secure: env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    },
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

  if (env.AMAZON_CLIENT_ID && env.AMAZON_CLIENT_SECRET) {
    setupAmazonStrategy()
  }

  if (env.APPLE_CLIENT_ID && env.APPLE_TEAM_ID && env.APPLE_KEY_ID && env.APPLE_PRIVATE_KEY) {
    setupAppleStrategy()
  }

  if (env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET) {
    setupMicrosoftStrategy()
  }

  if (env.REDDIT_CLIENT_ID && env.REDDIT_CLIENT_SECRET) {
    setupRedditStrategy()
  }

  if (env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET) {
    setupPayPalStrategy()
  }

  if (env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET) {
    setupLinkedInStrategy()
  }
})

declare module 'fastify' {
  interface FastifyInstance {
    redis: typeof redis
  }
}
