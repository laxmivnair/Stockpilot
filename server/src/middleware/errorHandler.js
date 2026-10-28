import { AppError } from '../errors/AppError.js'

export function errorHandler(err, _req, res, _next) {
  // If it's our own operational AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    })
  }

  // Handle PostgreSQL specific errors safely
  if (err.code === '23505') {
    // Unique violation
    return res.status(409).json({
      error: {
        code: 'UNIQUE_VIOLATION',
        message: 'A record with this unique value already exists.',
        details: err.detail || null,
      },
    })
  }

  if (err.code === '23503') {
    // Foreign key violation
    return res.status(400).json({
      error: {
        code: 'FOREIGN_KEY_VIOLATION',
        message: 'Referenced related record does not exist.',
        details: err.detail || null,
      },
    })
  }

  if (err.code === '23514') {
    // Check constraint violation
    return res.status(400).json({
      error: {
        code: 'CHECK_CONSTRAINT_VIOLATION',
        message: 'The operation violated a database integrity check constraint.',
      },
    })
  }

  // Unhandled / unexpected internal error
  console.error('Unhandled server error:', err)

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal server error occurred.',
    },
  })
}
