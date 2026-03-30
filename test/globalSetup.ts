import 'dotenv/config'
import pg from 'pg'
import { execSync } from 'node:child_process'

// TODO, is this really necessary, a function for this const used only once ?
function toTestDbUrl(url: string): string {
  const u = new URL(url)
  u.pathname = `${u.pathname}_test`
  return u.toString()
}

export async function setup() {
  const baseUrl = process.env.DATABASE_URL
  if (!baseUrl) throw new Error('DATABASE_URL is not set — check your .env file')

  const testUrl = toTestDbUrl(baseUrl)
  const testDbName = new URL(testUrl).pathname.slice(1) // remove leading "/"

  // Connect to the default "postgres" database to create the test DB
  const adminUrl = new URL(baseUrl)
  adminUrl.pathname = '/postgres'
  const client = new pg.Client({ connectionString: adminUrl.toString() })
  await client.connect()
  await client.query(`CREATE DATABASE "${testDbName}"`).catch((err: { code: string }) => {
    if (err.code !== '42P04') throw err // 42P04 = database already exists
  })
  await client.end()

  // Override DATABASE_URL so prisma migrate and all test workers use the test DB
  process.env.DATABASE_URL = testUrl

  // Apply migrations to the test database
  execSync('prisma migrate deploy', { stdio: 'inherit' })
}
