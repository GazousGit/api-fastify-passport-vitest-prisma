import { Strategy as GithubStrategy, type Profile } from 'passport-github2'
import { authenticator } from '../../../core/authenticator.js'
import { env } from '../../../core/env.js'
import { findOrCreateOAuthUser } from '../services/oauth.js'

export function setupGithubStrategy() {
  authenticator.use(
    'github',
    new GithubStrategy(
      {
        clientID: env.GITHUB_CLIENT_ID!,
        clientSecret: env.GITHUB_CLIENT_SECRET!,
        callbackURL: `${env.APP_URL}/auth/github/callback`,
        scope: ['user:email'],
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: (err: Error | null, user?: unknown) => void,
      ) => {
        try {
          type GithubEmail = { value: string; primary: boolean; verified: boolean }
          const emails = profile.emails as GithubEmail[] | undefined

          // GitHub may return multiple emails — pick the primary verified one
          const primaryEmail = emails?.find((e) => e.primary && e.verified)
          const email = primaryEmail?.value ?? emails?.[0]?.value

          const user = await findOrCreateOAuthUser({
            provider: 'github',
            providerAccountId: profile.id,
            email,
            emailVerified: primaryEmail?.verified === true,
            accessToken: _accessToken,
          })

          done(null, user)
        } catch (err) {
          done(err as Error)
        }
      },
    ),
  )
}
