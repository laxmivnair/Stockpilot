import { authService } from '../services/authService.js'
import { UnauthorizedError } from '../errors/AppError.js'

export async function authenticate(req, _res, next) {
  try {
    let token = null

    // Check Authorization header: Bearer <token>
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim()
    } else if (req.cookies?.stockpilot_session) {
      token = req.cookies.stockpilot_session
    }

    if (!token) {
      throw new UnauthorizedError('Authentication required. Please sign in.')
    }

    const user = await authService.verifySession(token)
    if (!user) {
      throw new UnauthorizedError('Invalid or expired session. Please sign in again.')
    }

    req.user = user
    req.token = token
    next()
  } catch (error) {
    next(error)
  }
}
