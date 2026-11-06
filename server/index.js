import app from './app.js'
import { config, databaseHint, databaseReady } from './env.js'
import { ping } from './db.js'

if (!process.env.VERCEL) {
  app.listen(config.port, () => {
    console.log(`Homeo API on http://localhost:${config.port}`)
    if (!databaseReady()) {
      console.warn(databaseHint())
    } else {
      ping().then((db) => {
        if (db.ok) console.log('Connected to Neon Postgres.')
        else console.warn(db.error)
      })
    }
  })
}

export default app
