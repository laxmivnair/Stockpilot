import { BadRequestError } from '../errors/AppError.js'

/**
 * Higher-order middleware function to validate incoming request data using Zod.
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against
 * @param {'body'|'query'|'params'} target - Request object property to validate
 */
export function validate(schema, target = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[target])
    if (!result.success) {
      const details = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }))
      return next(new BadRequestError('Validation failed', details))
    }
    req[target] = result.data
    next()
  }
}
