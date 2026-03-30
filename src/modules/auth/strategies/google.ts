import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { authenticator } from '../../../core/authenticator.js'
import { env } from '../../../core/env.js'
import { findOrCreateOAuthUser } from '../services/oauth.js'

export function setupGoogleStrategy() {
  authenticator.use(
    'google',
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID!,
        clientSecret: env.GOOGLE_CLIENT_SECRET!,
        callbackURL: `${env.APP_URL}/auth/google/callback`,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value
          const emailVerified = profile.emails?.[0]?.verified === true

          const user = await findOrCreateOAuthUser({
            provider: 'google',
            providerAccountId: profile.id,
            email,
            emailVerified,
            accessToken: _accessToken,
            refreshToken: _refreshToken ?? undefined,
          })

          done(null, user)
        } catch (err) {
          done(err as Error)
        }
      },
    ),
  )
}
