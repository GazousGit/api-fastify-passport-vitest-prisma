import { Strategy as AmazonStrategy } from 'passport-amazon'
import { authenticator } from '../../../core/authenticator.js'
import { env } from '../../../core/env.js'
import { findOrCreateOAuthUser } from '../services/oauth.js'

export function setupAmazonStrategy() {
  authenticator.use(
    'amazon',
    new AmazonStrategy(
      {
        clientID: env.AMAZON_CLIENT_ID!,
        clientSecret: env.AMAZON_CLIENT_SECRET!,
        callbackURL: `${env.APP_URL}/auth/amazon/callback`,
        scope: ['profile'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value

          const user = await findOrCreateOAuthUser({
            provider: 'amazon',
            providerAccountId: profile.id,
            email,
            emailVerified: false,
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
