import { Strategy as DiscordStrategy } from 'passport-discord'
import { authenticator } from '../../../core/authenticator.js'
import { env } from '../../../core/env.js'
import { findOrCreateOAuthUser } from '../services/oauth.js'

export function setupDiscordStrategy() {
  authenticator.use(
    'discord',
    new DiscordStrategy(
      {
        clientID: env.DISCORD_CLIENT_ID!,
        clientSecret: env.DISCORD_CLIENT_SECRET!,
        callbackURL: `${env.APP_URL}/auth/discord/callback`,
        scope: ['identify', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.email ?? undefined
          const emailVerified = profile.verified === true

          const user = await findOrCreateOAuthUser({
            provider: 'discord',
            providerAccountId: profile.id,
            email,
            emailVerified,
            accessToken,
            refreshToken: refreshToken ?? undefined,
          })

          done(null, user)
        } catch (err) {
          done(err instanceof Error ? err : new Error(String(err)))
        }
      },
    ),
  )
}
