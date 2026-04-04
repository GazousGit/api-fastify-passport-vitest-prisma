# api-fastify-passport-vitest-prisma

A fastify REST API with vitest, passport and prisma
The end goal is to get a 'expanded boilerplate' with session, redis and several auth mechanism (classic auth, 2fa, oauth, apiKey, maybe socket if I feel like it (not sure it fits auth since its more a feature for something else)) (Good luck me)

## Getting started

TODO -> Any global packages to install ? Do not forget to mention them here
TODO -> Mention what should be done in the env file (set google, github and others ids/secrets (mention the redirect urls, configuration that has to be done on the key, secret, etc...))
TODO -> mention the seed command to do after db:migrate
TODO -> make sure commands are in the corerct order of execution

```bash
cp .env.example .env
npm install
npm run db:up
npm run db:migrate
npm run dev
```

## Available Scripts

In the project directory, you can run:

### `npm run dev`

To start the app in dev mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm start`

For production mode

### `npm run test`

Run the test cases.

## OAuth providers

| Provider       | Tested | OAuth version | Package                         | Notes                           |
| -------------- | ------ | ------------- | ------------------------------- | ------------------------------- |
| 🔵 Google      | ✅     | 2.0           | `passport-google-oauth20`       |                                 |
| 🐙 GitHub      | ✅     | 2.0           | `passport-github2`              |                                 |
| 🔷 Facebook    | ✅     | 2.0           | `passport-facebook`             | Add email permission            |
| 🐦 Twitter / X | ✅     | 1.0a          | `passport-twitter`              | Legacy protocol                 |
| 🟣 Discord     | ✅     | 2.0           | `passport-discord`              |                                 |
| 🪟 Microsoft   | ✅     | 2.0           | `passport-microsoft`            | Requires Azure account          |
| 🍎 Apple       | ❌     | 2.0 (OIDC)    | `passport-apple`                | Requires paid Apple Dev account |
| 📦 Amazon      | ✅     | 2.0           | `passport-amazon`               |                                 |
| 🤖 Reddit      | ❌     | 2.0           | `passport-oauth2` (custom)      | Requires API access from admins |
| 💳 PayPal      | ⚠️     | 2.0 (OIDC)    | `passport-paypal-openidconnect` | Add email permission            |
| 🔗 LinkedIn    | ✅     | OAuth 2.0     | `passport-linkedin-oauth2`      | Add email permission            |

apple -> require paiement, and it's not cheap

reddit -> Had to ask API access to admin in order to get credentials, awaiting approve

paypal -> dev portal has issues, I can't save the email permission nor the callback URL

instagram -> API had major changes and getting a ClientID/Secret was already painfull (nothing looks like it use to couple months ago) the real deal breaker was that the callback URL http://localhost/auth/instagram/callback was not accepted

## Learn More

To learn Fastify, check out the [Fastify documentation](https://fastify.dev/docs/latest/).

TODO, an explanation of files and folder structure could be great:
prisma
src/core
src/plugins
src/modules
src/routes
src/types
test

TODO convention used for file naming, variable naming (others)
test files (spec, unit, integration)
using the function approach (not class, etc..)

IMPORTANT THINGS TO DO

- HTTPS
- Local auth needs 2FA! (linking account sounds risky but we could add a 2fa email uppon successful login with oauth so email get confirmed, in case oauth provider is compromised)
- Make up my mind about a package to handle Datetime (probably date-fns) and use it for any date soo everything is consistent (shall I stick to UTC everytime ? anything to set in the db (best datetime format to save? remember about the operation gte lte with dates))
- ApiKey
