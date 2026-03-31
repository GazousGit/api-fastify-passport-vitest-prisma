import { Strategy as FacebookStrategy } from 'passport-facebook'
import { authenticator } from '../../../core/authenticator.js'
import { env } from '../../../core/env.js'
import { findOrCreateOAuthUser } from '../services/oauth.js'

export function setupFacebookStrategy() {
  authenticator.use(
    'facebook',
    new FacebookStrategy(
      {
        clientID: env.FACEBOOK_CLIENT_ID!,
        clientSecret: env.FACEBOOK_CLIENT_SECRET!,
        callbackURL: `${env.APP_URL}/auth/facebook/callback`,
        profileFields: ['id', 'emails'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value

          const user = await findOrCreateOAuthUser({
            provider: 'facebook',
            providerAccountId: profile.id,
            email,
            emailVerified: false, // not available
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
