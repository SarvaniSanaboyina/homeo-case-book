import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
dotenv.config({ path: path.join(root, '.env') })

export const rootDir = root

function databaseUrl() {
  const raw = process.env.DATABASE_URL || ''
  if (!raw) return ''
  try {
    const url = new URL(raw)
    url.searchParams.delete('channel_binding')
    return url.toString()
  } catch {
    return raw.replace(/(&|\?)channel_binding=[^&]*/g, '$1').replace(/\?&/, '?').replace(/[?&]$/, '')
  }
}

export const config = {
  port: Number(process.env.PORT) || 4000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  databaseUrl: databaseUrl(),
  databaseSsl: process.env.DATABASE_SSL !== 'false',
}

const PLACEHOLDER = /YOUR_PASSWORD|example-xxxxx|:PASSWORD@|neondb_owner:USER/i

export function databaseReady() {
  return Boolean(config.databaseUrl) && !PLACEHOLDER.test(config.databaseUrl)
}

export function databaseHint() {
  if (!config.databaseUrl) {
    return 'DATABASE_URL is missing. Copy .env.example to .env and paste your Neon connection string.'
  }
  if (PLACEHOLDER.test(config.databaseUrl)) {
    return 'DATABASE_URL is still the example placeholder. Open .env and paste the pooled URI from your Neon project.'
  }
  return ''
}
