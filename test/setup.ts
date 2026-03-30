import { config } from 'dotenv'

config()

// Fallbacks for CI where no .env file exists.
// Spec tests mock all services so these values are never used at runtime.
process.env.DATABASE_URL ??= 'postgresql://localhost:5432/placeholder'
process.env.SESSION_SECRET ??= 'placeholder-secret-minimum-32-characters-long'
