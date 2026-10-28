import { ForbiddenError } from '../errors/AppError.js'

export function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('User identity not established'))
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Action requires ${allowedRoles.join(' or ')} privileges. Your current role is '${req.user.role}'`
        )
      )
    }

    next()
  }
}
