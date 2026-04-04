import { Strategy as MicrosoftStrategy } from 'passport-microsoft'
import type { Profile } from 'passport'
import { authenticator } from '../../../core/authenticator.js'
import { env } from '../../../core/env.js'
import { findOrCreateOAuthUser } from '../services/oauth.js'

export function setupMicrosoftStrategy() {
  authenticator.use(
    'microsoft',
    new MicrosoftStrategy(
      {
        clientID: env.MICROSOFT_CLIENT_ID!,
        clientSecret: env.MICROSOFT_CLIENT_SECRET!,
        callbackURL: `${env.APP_URL}/auth/microsoft/callback`,
        scope: ['user.read'],
      },
      async (accessToken: string, refreshToken: string, profile: Profile, done: (err: Error | null, user?: unknown) => void) => {
        try {
          const email = profile.emails?.[0]?.value

          const user = await findOrCreateOAuthUser({
            provider: 'microsoft',
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
