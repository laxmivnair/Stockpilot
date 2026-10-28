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
      throw new UnauthorizedError('Invalid email or password')
    }

    if (!user.is_active) {
      throw new UnauthorizedError('Your account has been deactivated. Please contact an administrator.')
    }

    const passwordMatches = await verify(user.password_hash, password)
    if (!passwordMatches) {
      throw new UnauthorizedError('Invalid email or password')
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
