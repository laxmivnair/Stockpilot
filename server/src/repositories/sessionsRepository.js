import { pool } from '../config/db.js'

export const sessionsRepository = {
  async createSession({ userId, tokenHash, expiresAt }) {
    const query = `
      INSERT INTO sessions (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id, user_id, expires_at, created_at
    `
    const { rows } = await pool.query(query, [userId, tokenHash, expiresAt])
    return rows[0]
  },

  async findValidSession(tokenHash) {
    const query = `
      SELECT 
        s.id AS session_id,
        s.expires_at,
        u.id AS user_id,
        u.email,
        u.full_name,
        u.role,
        u.is_active
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token_hash = $1
        AND s.revoked_at IS NULL
        AND s.expires_at > now()
        AND u.is_active = TRUE
    `
    const { rows } = await pool.query(query, [tokenHash])
    return rows[0] || null
  },

  async revokeSession(tokenHash) {
    const query = `
      UPDATE sessions
      SET revoked_at = now()
      WHERE token_hash = $1 AND revoked_at IS NULL
      RETURNING id, revoked_at
    `
    const { rows } = await pool.query(query, [tokenHash])
    return rows[0] || null
  },

  async revokeUserSessions(userId) {
    const query = `
      UPDATE sessions
      SET revoked_at = now()
      WHERE user_id = $1 AND revoked_at IS NULL
    `
    await pool.query(query, [userId])
  },
}
