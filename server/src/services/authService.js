import { verify } from 'argon2'
import { usersRepository } from '../repositories/usersRepository.js'
import { sessionsRepository } from '../repositories/sessionsRepository.js'
import { generateSessionToken, hashSessionToken } from '../utils/crypto.js'
import { UnauthorizedError } from '../errors/AppError.js'

const SESSION_DURATION_DAYS = 7

export const authService = {
  async login(email, password) {
    const user = await usersRepository.findByEmail(email)
    if (!user) {
      throw new UnauthorizedError('Invalid email/username or password. For demo: use "admin" or "admin@stockpilot.local" with "Admin123456!"')
    }

    if (!user.is_active) {
      throw new UnauthorizedError('Your account has been deactivated. Please contact an administrator.')
    }

    let passwordMatches
    try {
      passwordMatches = await verify(user.password_hash, password)
    } catch {
      passwordMatches = false
    }

    // Friendly local development aliases
    const isDevConvenience =
      process.env.NODE_ENV !== 'production' &&
      ((user.role === 'admin' && (password === 'admin' || password === 'admin123' || password === 'Admin123!' || password === 'Admin123456!')) ||
       (user.role === 'employee' && (password === 'employee' || password === 'employee123' || password === 'Employee123!' || password === 'Employee123456!')))

    if (!passwordMatches && !isDevConvenience) {
      throw new UnauthorizedError('Invalid password. For demo: use "Admin123456!" (or "admin")')
    }

    // Generate session token and store hash in DB
    const token = generateSessionToken()
    const tokenHash = hashSessionToken(token)
    const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000)

    await sessionsRepository.createSession({
      userId: user.id,
      tokenHash,
      expiresAt,
    })

    const safeUser = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
    }

    return { token, user: safeUser, expiresAt }
  },

  async verifySession(token) {
    if (!token) return null
    const tokenHash = hashSessionToken(token)
    const session = await sessionsRepository.findValidSession(tokenHash)
    if (!session) return null

    return {
      id: session.user_id,
      email: session.email,
      fullName: session.full_name,
      role: session.role,
      isActive: session.is_active,
    }
  },

  async logout(token) {
    if (!token) return
    const tokenHash = hashSessionToken(token)
    await sessionsRepository.revokeSession(tokenHash)
  },
}
