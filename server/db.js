import dns from 'node:dns'
import pg from 'pg'
import { config, databaseHint, databaseReady } from './env.js'

dns.setServers(['1.1.1.1', '8.8.8.8', '1.0.0.1'])
dns.setDefaultResultOrder('ipv4first')

const systemLookup = dns.lookup.bind(dns)
dns.lookup = function lookup(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }
  dns.resolve4(hostname, (error, addresses) => {
    if (!error && addresses?.length) {
      if (options?.all) {
        callback(null, addresses.map((address) => ({ address, family: 4 })))
        return
      }
      callback(null, addresses[0], 4)
      return
    }
    systemLookup(hostname, options, callback)
  })
}

pg.types.setTypeParser(1082, (value) => value)
pg.types.setTypeParser(1114, (value) => value)
pg.types.setTypeParser(1184, (value) => new Date(value).toISOString())

let pool

export function getPool() {
  if (!databaseReady()) {
    const error = new Error(databaseHint())
    error.status = 503
    throw error
  }
  if (!pool) {
    pool = new pg.Pool({
      connectionString: config.databaseUrl,
      ssl: config.databaseSsl ? { rejectUnauthorized: true } : false,
      max: 8,
      connectionTimeoutMillis: 15000,
    })
  }
  return pool
}

export async function query(text, params = []) {
  const result = await getPool().query(text, params)
  return result
}

export async function withClient(fn) {
  const client = await getPool().connect()
  try {
    return await fn(client)
  } finally {
    client.release()
  }
}

export async function withTransaction(fn) {
  return withClient(async (client) => {
    await client.query('BEGIN')
    try {
      const result = await fn(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  })
}

export async function ping() {
  if (!databaseReady()) return { ok: false, error: databaseHint() }
  try {
    await query('SELECT 1 AS ok')
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: 'Could not reach Neon. Check DATABASE_URL, then run npm run db:migrate.',
      detail: error.message,
    }
  }
}
