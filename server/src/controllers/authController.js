import { authService } from '../services/authService.js'

export const authController = {
  async login(req, res, next) {
    try {
      const { email, password } = req.body
      const result = await authService.login(email, password)

      // Set cookie for browser clients (httpOnly, sameSite lax)
      res.cookie('stockpilot_session', result.token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        expires: result.expiresAt,
      })

      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  },

  async getMe(req, res) {
    res.status(200).json({ user: req.user })
  },

  async logout(req, res, next) {
    try {
      await authService.logout(req.token)
      res.clearCookie('stockpilot_session')
      res.status(200).json({ message: 'Logged out successfully' })
    } catch (error) {
      next(error)
    }
  },
}
