import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pool } from '../src/config/db.js'

const directory = resolve(import.meta.dirname, '../db/migrations')

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)

  const files = (await readdir(directory)).filter((file) => file.endsWith('.sql')).sort()

  for (const file of files) {
    const applied = await pool.query('SELECT 1 FROM schema_migrations WHERE filename = $1', [file])
    if (applied.rowCount) {
      console.log(`Already applied: ${file}`)
      continue
    }

    const sql = await readFile(resolve(directory, file), 'utf8')
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file])
      await client.query('COMMIT')
      console.log(`Applied: ${file}`)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
} catch (error) {
  console.error('Migration failed:', error.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
