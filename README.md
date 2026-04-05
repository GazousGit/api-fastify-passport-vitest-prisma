# api-fastify-passport-vitest-prisma

An expanded authentication boilerplate built with Fastify, Passport, Prisma, Redis and Vitest. The goal is to provide a solid starting point covering session management, local auth, two-factor authentication (OTP and TOTP), OAuth, and API key auth.

## Prerequisites

- Node.js
- Docker (for the PostgreSQL and Redis containers)

## Getting started

```bash
cp .env.example .env
npm install
npm run db:up         # start PostgreSQL and Redis via Docker
npm run db:migrate    # run Prisma migrations
npm run db:seed       # seed the database
npm run dev
```

The API will be available at [http://localhost:3000](http://localhost:3000).  
Interactive API docs (Scalar) are at [http://localhost:3000/docs](http://localhost:3000/docs).

## Environment variables

Copy `.env.example` to `.env` and fill in the values:

| Variable                                                                   | Required | Description                                                                       |
| -------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                             | ✅       | PostgreSQL connection string                                                      |
| `REDIS_URL`                                                                | ✅       | Redis connection string (default: `redis://localhost:6379`)                       |
| `SESSION_SECRET`                                                           | ✅       | At least 32 characters                                                            |
| `SESSION_SALT`                                                             | ✅       | Exactly 16 characters                                                             |
| `APP_URL`                                                                  | ✅       | Base URL of the API — used for OAuth callback URLs (e.g. `http://localhost:3000`) |
| `ALLOWED_ORIGIN`                                                           | ✅       | CORS allowed origin (e.g. your frontend URL)                                      |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`                                | ➖       | [Google Cloud Console](https://console.cloud.google.com/)                         |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`                                | ➖       | GitHub → Settings → Developer settings → OAuth Apps                               |
| `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET`                            | ➖       | Meta for Developers — add email permission                                        |
| `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET`                              | ➖       | Twitter Developer Portal (OAuth 1.0a)                                             |
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`                              | ➖       | Discord Developer Portal                                                          |
| `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET`                          | ➖       | Azure Portal — requires an Azure account                                          |
| `APPLE_CLIENT_ID` / `APPLE_TEAM_ID` / `APPLE_KEY_ID` / `APPLE_PRIVATE_KEY` | ➖       | Apple Developer — requires a paid account                                         |
| `AMAZON_CLIENT_ID` / `AMAZON_CLIENT_SECRET`                                | ➖       | Amazon Developer Console                                                          |
| `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET`                                | ➖       | Reddit App Preferences — requires admin approval for API access                   |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET`                                | ➖       | PayPal Developer Dashboard                                                        |
| `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET`                            | ➖       | LinkedIn Developer Portal — add email permission                                  |

For each OAuth provider, set the callback URL to `{APP_URL}/auth/{provider}/callback` (e.g. `http://localhost:3000/auth/google/callback`). Providers with empty credentials are simply skipped at startup.

## Available scripts

| Script                     | Description                                                |
| -------------------------- | ---------------------------------------------------------- |
| `npm run dev`              | Start in development mode (TypeScript watch + auto-reload) |
| `npm start`                | Build and start in production mode                         |
| `npm test`                 | Run all tests                                              |
| `npm run test:watch`       | Run tests in watch mode                                    |
| `npm run test:coverage`    | Run tests with coverage report                             |
| `npm run build:ts`         | Compile TypeScript                                         |
| `npm run typecheck`        | Type-check without emitting                                |
| `npm run lint`             | Lint source files                                          |
| `npm run lint:fix`         | Lint and auto-fix                                          |
| `npm run format`           | Format with Prettier                                       |
| `npm run db:up`            | Start Docker containers (PostgreSQL + Redis)               |
| `npm run db:down`          | Stop Docker containers                                     |
| `npm run db:migrate`       | Run Prisma migrations                                      |
| `npm run db:migrate:prod`  | Deploy migrations (production)                             |
| `npm run db:seed`          | Seed the database                                          |
| `npm run db:studio`        | Open Prisma Studio                                         |
| `npm run db:reset`         | Reset the database and re-run migrations                   |
| `npm run clean`            | Remove `node_modules`, `dist`, `coverage` and reinstall    |

## Project structure

```
prisma/          Prisma schema, migrations, and seed
src/
  core/          App-wide infrastructure (env, logger, Redis, Prisma, error handling)
  plugins/       Fastify plugins registered globally (auth, CORS, rate-limit, Swagger…)
  modules/       Feature modules — each contains services, middlewares, types, and tests
    auth/        Local auth, OAuth strategies, 2FA (OTP + TOTP), hooks
    user/        User CRUD services and middlewares
    apiKey/      API key creation, revocation, renewal
  routes/        Route definitions (thin layer — delegates to module services)
  types/         Shared TypeScript types and Fastify augmentations
test/            Global test setup and helpers
```

## Conventions

- **Functions over classes** — services are plain async functions, not class methods
- **Test file naming** — `.unit.ts` for all tests (pure logic or DB), `.spec.ts` for route-level tests with mocked services. Files always sit next to the code they test
- **Session** — uses `@fastify/secure-session` (stateless encrypted cookie). The session is stored in the cookie itself — no database table needed. Redis is used only for OTP tokens, TOTP setup, password reset tokens, and pending 2FA tokens

## API key authorization notes

The current authorization rules are intentionally simple (this is a demo project):

- `POST /api-keys` — requires authentication
- `POST /api-keys/:id/renew` — requires admin role
- `DELETE /api-keys/:id` and `POST /api-keys/:id/revoke` — admin only
- `GET /check-api-key` — validates an API key

## OAuth providers

| Provider       | Tested | OAuth version | Package                         |
| -------------- | ------ | ------------- | ------------------------------- |
| 🔵 Google      | ✅     | 2.0           | `passport-google-oauth20`       |
| 🐙 GitHub      | ✅     | 2.0           | `passport-github2`              |
| 🔷 Facebook    | ✅     | 2.0           | `passport-facebook`             |
| 🐦 Twitter / X | ✅     | 1.0a          | `passport-twitter`              |
| 🟣 Discord     | ✅     | 2.0           | `passport-discord`              |
| 🪟 Microsoft   | ✅     | 2.0           | `passport-microsoft`            |
| 🍎 Apple       | ❌     | 2.0 (OIDC)    | `passport-apple`                |
| 📦 Amazon      | ✅     | 2.0           | `passport-amazon`               |
| 🤖 Reddit      | ❌     | 2.0           | `passport-oauth2` (custom)      |
| 💳 PayPal      | ⚠️     | 2.0 (OIDC)    | `passport-paypal-openidconnect` |
| 🔗 LinkedIn    | ✅     | 2.0           | `passport-linkedin-oauth2`      |

**Apple** — requires a paid Apple Developer account.  
**Reddit** — requires admin approval for API access.  
**PayPal** — dev portal issues prevented saving the callback URL and email permission at time of testing.  
**Instagram** — dropped: the API changed significantly, obtaining credentials is painful, and `http://localhost` callback URLs are not accepted.

## Known limitations / things to improve

- Constants (especially exported ones like `PENDING_2FA_PREFIX`) should be moved to a dedicated `constants.ts` file
- Register/login should be tested against edge-case email formats (uppercase, special characters) and the validation regex reviewed
- Phone number validation could benefit from a library like `awesome-phonenumber`, paired with a `mobileCountry` field for proper international validation
- OAuth login currently creates an account without confirming the email — linking an email 2FA step after a successful OAuth login would confirm the address and add a layer of protection if the OAuth provider is compromised
- Code conventions document (boolean naming, ESLint/Prettier rules, line length limit) would be worth adding
