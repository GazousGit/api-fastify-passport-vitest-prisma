import OAuth2Strategy, { type VerifyCallback } from 'passport-oauth2'
import { authenticator } from '../../../core/authenticator.js'
import { env } from '../../../core/env.js'
import { findOrCreateOAuthUser } from '../services/oauth.js'

interface RedditProfile {
  id: string
  name: string
  _json: unknown
  _raw: unknown
}

type RedditVerifyFunction = (
  accessToken: string,
  refreshToken: string,
  profile: RedditProfile,
  done: VerifyCallback,
) => void

class RedditStrategy extends OAuth2Strategy {
  constructor(options: OAuth2Strategy.StrategyOptions, verify: RedditVerifyFunction) {
    super(options, verify)
    this.name = 'reddit'
  }

  override userProfile(accessToken: string, done: (err: Error | null, profile?: unknown) => void) {
    this._oauth2.get('https://oauth.reddit.com/api/v1/me', accessToken, (err, body) => {
      if (err) return done(new Error('Failed to fetch Reddit profile'))
      try {
        const json = JSON.parse(body as string)
        done(null, {
          id: json.id as string,
          name: json.name as string,
          _json: json,
          _raw: body,
        })
      } catch (e) {
        done(e instanceof Error ? e : new Error(String(e)))
      }
    })
  }
}

export function setupRedditStrategy() {
  authenticator.use(
    'reddit',
    new RedditStrategy(
      {
        authorizationURL: 'https://www.reddit.com/api/v1/authorize',
        tokenURL: 'https://www.reddit.com/api/v1/access_token',
        clientID: env.REDDIT_CLIENT_ID!,
        clientSecret: env.REDDIT_CLIENT_SECRET!,
        callbackURL: `${env.APP_URL}/auth/reddit/callback`,
        scope: ['identity'],
        customHeaders: {
          Authorization: `Basic ${Buffer.from(`${env.REDDIT_CLIENT_ID}:${env.REDDIT_CLIENT_SECRET}`).toString('base64')}`,
          'User-Agent': 'nodejs:auth-api:1.0.0',
        },
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const user = await findOrCreateOAuthUser({
            provider: 'reddit',
            providerAccountId: profile.id,
            emailVerified: false,
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
