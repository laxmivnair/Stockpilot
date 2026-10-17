import { hash } from 'argon2'
import { pool } from '../src/config/db.js'

const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase()
const password = process.env.SEED_ADMIN_PASSWORD
const name = process.env.SEED_ADMIN_NAME?.trim() || 'StockPilot Admin'

try {
  if (!email || !password || password.length < 16) {
    throw new Error('Set SEED_ADMIN_EMAIL and a SEED_ADMIN_PASSWORD of at least 16 characters in .env.')
  }

  const existing = await pool.query('SELECT id FROM users WHERE lower(email) = $1', [email])
  if (existing.rowCount) {
    console.log('Seed admin already exists; no account was changed.')
  } else {
    const passwordHash = await hash(password)
    await pool.query(
      'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4)',
      [email, passwordHash, name, 'admin'],
    )
    console.log('Seed admin created.')
  }
} catch (error) {
  console.error('Seed failed:', error.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
