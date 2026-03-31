import { Strategy as TwitterStrategy } from 'passport-twitter'
import { authenticator } from '../../../core/authenticator.js'
import { env } from '../../../core/env.js'
import { findOrCreateOAuthUser } from '../services/oauth.js'

export function setupTwitterStrategy() {
  authenticator.use(
    'twitter',
    new TwitterStrategy(
      {
        // Twitter OAuth 1.0a uses consumerKey/consumerSecret terminology
        consumerKey: env.TWITTER_CLIENT_ID!,
        consumerSecret: env.TWITTER_CLIENT_SECRET!,
        callbackURL: `${env.APP_URL}/auth/x-twitter/callback`,
        includeEmail: true,
      },
      async (token, _tokenSecret, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value

          const user = await findOrCreateOAuthUser({
            provider: 'twitter',
            providerAccountId: profile.id,
            email,
            emailVerified: false, // not available
            accessToken: token,
          })

          done(null, user)
        } catch (err) {
          done(err instanceof Error ? err : new Error(String(err)))
        }
      },
    ),
  )
}
