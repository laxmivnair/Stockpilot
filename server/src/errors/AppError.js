export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details = null) {
    super(message, 404, 'NOT_FOUND', details)
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details = null) {
    super(message, 400, 'BAD_REQUEST', details)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', details = null) {
    super(message, 401, 'UNAUTHORIZED', details)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action', details = null) {
    super(message, 403, 'FORBIDDEN', details)
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details = null) {
    super(message, 409, 'CONFLICT', details)
  }
}

export class InsufficientStockError extends AppError {
  constructor(productName, requested, available) {
    super(
      `Insufficient stock for '${productName}'. Requested: ${requested}, Available: ${available}`,
      400,
      'INSUFFICIENT_STOCK',
      { productName, requested, available }
    )
  }
}
