import crypto from 'node:crypto'

/**
 * Generate a cryptographically secure random session token.
 * We return 32 bytes as a 64-character hex string.
 */
export function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Hash a session token using SHA-256 before storing or searching in the database.
 * This prevents anyone with read access to the database from impersonating active sessions.
 */
export function hashSessionToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}
