import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(3000),
    LOG_LEVEL: z
      .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'])
      .default('info'),
    DATABASE_URL: z.url(),
    ALLOWED_ORIGIN: z.url().optional(),
    SESSION_SECRET: z.string().min(32),
    REDIS_URL: z.string().default('redis://localhost:6379'),
    APP_URL: z.url().default('http://localhost:3000'),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    FACEBOOK_CLIENT_ID: z.string().optional(),
    FACEBOOK_CLIENT_SECRET: z.string().optional(),
    TWITTER_CLIENT_ID: z.string().optional(),
    TWITTER_CLIENT_SECRET: z.string().optional(),
    DISCORD_CLIENT_ID: z.string().optional(),
    DISCORD_CLIENT_SECRET: z.string().optional(),
    MICROSOFT_CLIENT_ID: z.string().optional(),
    MICROSOFT_CLIENT_SECRET: z.string().optional(),
    APPLE_CLIENT_ID: z.string().optional(),
    APPLE_TEAM_ID: z.string().optional(),
    APPLE_KEY_ID: z.string().optional(),
    APPLE_PRIVATE_KEY: z.string().optional(),
    AMAZON_CLIENT_ID: z.string().optional(),
    AMAZON_CLIENT_SECRET: z.string().optional(),
    REDDIT_CLIENT_ID: z.string().optional(),
    REDDIT_CLIENT_SECRET: z.string().optional(),
    PAYPAL_CLIENT_ID: z.string().optional(),
    PAYPAL_CLIENT_SECRET: z.string().optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
