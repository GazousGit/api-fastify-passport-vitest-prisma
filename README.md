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

Add a small table with list of oauth provider :
column name + icon
column tested (with a green check)
column oauth version
column package needed
column comment
apple comment -> require paiement
microsoft comment -> reuires azure account
facebook comment -> add email permission when getting oauth credentials
reddit -> Have to ask API access to admin in order to get credentials
paypal -> do not forget to set email permission (you can even choose to check for verified email or not) dev portal has issues, I can't save the email permission nor the callback URL so I can't test it for now

IMPORTANT THINGS TO DO

- HTTPS
- Local auth needs 2FA! (linking account sounds risky but we could add a 2fa email uppon successful login with oauth so email get confirmed, in case oauth provider is compromised)
- Make up my mind about a package to handle Datetime (probably date-fns) and use it for any date soo everything is consistent (shall I stick to UTC everytime ? anything to set in the db (best datetime format to save? remember about the operation gte lte with dates))
- ApiKey
