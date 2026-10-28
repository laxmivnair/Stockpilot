import { hash } from 'argon2'
import { pool } from '../src/config/db.js'

async function reset() {
  const h = await hash('Admin123456!')
  await pool.query('UPDATE users SET password_hash = $1 WHERE lower(email) = $2', [h, 'admin@stockpilot.local'])
  console.log('Admin password successfully set to Admin123456!')
  await pool.end()
}

reset()
