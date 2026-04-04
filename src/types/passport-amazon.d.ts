declare module 'passport-amazon' {
  import OAuth2Strategy = require('passport-oauth2')

  interface AmazonStrategyOptions {
    clientID: string
    clientSecret: string
    callbackURL: string
    scope?: string[]
  }

  interface Profile {
    id: string
    displayName: string
    emails?: Array<{ value: string }>
    _raw: string
    _json: Record<string, unknown>
  }

  class Strategy extends OAuth2Strategy {
    constructor(
      options: AmazonStrategyOptions,
      verify: (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: (err: Error | null, user?: unknown) => void,
      ) => void,
    )
  }
}
