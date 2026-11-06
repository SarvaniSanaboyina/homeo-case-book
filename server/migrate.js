import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { databaseHint, databaseReady } from './env.js'
import { getPool } from './db.js'
import { addExample } from './clinic.js'

const here = path.dirname(fileURLToPath(import.meta.url))

function statementsFrom(sql) {
  return sql
    .split(/;\s*(?:\n|$)/)
    .map((item) => item.trim())
    .filter((item) => item && !item.startsWith('--'))
}

async function migrate() {
  if (!databaseReady()) {
    console.error(databaseHint())
    process.exit(1)
  }

  const sql = fs.readFileSync(path.join(here, 'schema.sql'), 'utf8')
  const pool = getPool()
  const client = await pool.connect()
  try {
    for (const statement of statementsFrom(sql)) {
      await client.query(statement)
    }
    console.log('Neon schema is ready: patients, case_sheets, prescriptions, follow_ups.')
  } finally {
    client.release()
  }

  if (process.argv.includes('--example')) {
    await addExample()
    console.log('Example patient added.')
  }

  await pool.end()
}

migrate().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
