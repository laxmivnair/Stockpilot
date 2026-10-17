import { pool } from '../src/config/db.js'

try {
  const result = await pool.query(`
    SELECT current_database() AS database,
           (SELECT count(*)::int FROM schema_migrations) AS migrations
  `)
  console.log(`Connected to ${result.rows[0].database}; ${result.rows[0].migrations} migration(s) applied.`)
} catch (error) {
  console.error('Database check failed:', error.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
