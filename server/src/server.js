import { app } from './app.js'
import { env } from './config/env.js'
import { pool } from './config/db.js'

const server = app.listen(env.PORT, () => {
  console.log(`StockPilot API listening on http://localhost:${env.PORT}`)
})

async function shutdown() {
  server.close()
  await pool.end()
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
