declare module 'passport-paypal-openidconnect' {
  import OpenIDConnectStrategy = require('passport-openidconnect')

  interface PayPalStrategyOptions {
    clientID: string
    clientSecret: string
    callbackURL: string
    issuer?: string
    sandbox?: boolean
    scope?: string[]
  }

  class Strategy extends OpenIDConnectStrategy {
    constructor(options: PayPalStrategyOptions, verify: OpenIDConnectStrategy.VerifyFunction)
  }
}
