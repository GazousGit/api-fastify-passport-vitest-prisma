import AppleStrategy from 'passport-apple'
import { authenticator } from '../../../core/authenticator.js'
import { env } from '../../../core/env.js'
import { findOrCreateOAuthUser } from '../services/oauth.js'

export function setupAppleStrategy() {
  authenticator.use(
    'apple',
    new AppleStrategy(
      {
        clientID: env.APPLE_CLIENT_ID!,
        teamID: env.APPLE_TEAM_ID!,
        keyID: env.APPLE_KEY_ID!,
        privateKeyString: env.APPLE_PRIVATE_KEY!,
        callbackURL: `${env.APP_URL}/auth/apple/callback`,
        passReqToCallback: false,
      },
      async (accessToken, refreshToken, idToken, _profile, done) => {
        try {
          // Apple's profile is sparse; decode the idToken JWT to get the subject and email
          const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64url').toString())
          const email: string | undefined = payload.email
          const emailVerified = payload.email_verified === true || payload.email_verified === 'true'

          const user = await findOrCreateOAuthUser({
            provider: 'apple',
            providerAccountId: payload.sub as string,
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
