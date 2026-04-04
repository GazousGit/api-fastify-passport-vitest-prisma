import { Strategy as PayPalStrategy } from 'passport-paypal-openidconnect'
import type { Profile } from 'passport'
import { authenticator } from '../../../core/authenticator.js'
import { env } from '../../../core/env.js'
import { findOrCreateOAuthUser } from '../services/oauth.js'

export function setupPayPalStrategy() {
  authenticator.use(
    'paypal',
    new PayPalStrategy(
      {
        clientID: env.PAYPAL_CLIENT_ID!,
        clientSecret: env.PAYPAL_CLIENT_SECRET!,
        callbackURL: `${env.APP_URL}/auth/paypal/callback`,
        sandbox: env.NODE_ENV !== 'production',
        scope: ['openid', 'profile', 'email'],
        issuer: env.NODE_ENV === 'production' ? 'https://www.paypal.com' : 'https://www.sandbox.paypal.com',
      },
      async (_issuer: string, profile: Profile, done: (err: Error | null | undefined, user?: Express.User) => void) => {
        try {
          const email = profile.emails?.[0]?.value

          const user = await findOrCreateOAuthUser({
            provider: 'paypal',
            providerAccountId: profile.id,
            email,
            emailVerified: false,
          })

          done(null, user)
        } catch (err) {
          done(err instanceof Error ? err : new Error(String(err)))
        }
      },
    ),
  )
}
