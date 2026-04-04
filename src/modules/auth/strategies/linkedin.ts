import OAuth2Strategy, { type VerifyCallback } from 'passport-oauth2'
import { authenticator } from '../../../core/authenticator.js'
import { env } from '../../../core/env.js'
import { findOrCreateOAuthUser } from '../services/oauth.js'

interface LinkedInProfile {
  sub: string
  name?: string
  email?: string
  email_verified?: boolean
}

type LinkedInVerifyFunction = (
  accessToken: string,
  refreshToken: string,
  profile: LinkedInProfile,
  done: VerifyCallback,
) => void

class LinkedInStrategy extends OAuth2Strategy {
  constructor(options: OAuth2Strategy.StrategyOptions, verify: LinkedInVerifyFunction) {
    super(options, verify)
    this.name = 'linkedin'
    this._oauth2.useAuthorizationHeaderforGET(true)
  }

  override userProfile(accessToken: string, done: (err: Error | null, profile?: unknown) => void) {
    this._oauth2.get('https://api.linkedin.com/v2/userinfo', accessToken, (err, body) => {
      if (err) return done(new Error('Failed to fetch LinkedIn profile'))
      try {
        const json = JSON.parse(body as string) as LinkedInProfile
        done(null, json)
      } catch (e) {
        done(e instanceof Error ? e : new Error(String(e)))
      }
    })
  }
}

export function setupLinkedInStrategy() {
  authenticator.use(
    'linkedin',
    new LinkedInStrategy(
      {
        authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
        tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
        clientID: env.LINKEDIN_CLIENT_ID!,
        clientSecret: env.LINKEDIN_CLIENT_SECRET!,
        callbackURL: `${env.APP_URL}/auth/linkedin/callback`,
        scope: ['openid', 'profile', 'email'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const user = await findOrCreateOAuthUser({
            provider: 'linkedin',
            providerAccountId: profile.sub,
            email: profile.email,
            emailVerified: profile.email_verified ?? false,
            accessToken: _accessToken,
            refreshToken: _refreshToken ?? undefined,
          })

          done(null, user)
        } catch (err) {
          done(err instanceof Error ? err : new Error(String(err)))
        }
      },
    ),
  )
}
