/** Stable, client-facing error type. `code` is the contract (doc 09 §3); `message` is shown to the user verbatim. */
export class ApiError extends Error {
  constructor(status, code, message, extra = {}) {
    super(message)
    this.status = status
    this.code = code
    this.details = extra.details
    this.retryAfterSeconds = extra.retryAfterSeconds
  }
}

export const E = {
  validation: (details, message = 'Please check the highlighted fields.') => new ApiError(422, 'VALIDATION_FAILED', message, { details }),
  badRequest: (message = 'Invalid request.', code = 'BAD_REQUEST') => new ApiError(400, code, message),
  unauthorized: (message = 'Please log in to continue.', code = 'UNAUTHENTICATED') => new ApiError(401, code, message),
  forbidden: (message = 'You do not have access to this.', code = 'FORBIDDEN') => new ApiError(403, code, message),
  notFound: (message = 'We could not find that.', code = 'NOT_FOUND') => new ApiError(404, code, message),
  conflict: (message, code = 'CONFLICT') => new ApiError(409, code, message),
  rateLimited: (retryAfterSeconds, message = 'Too many attempts. Please try again later.', code = 'RATE_LIMITED') =>
    new ApiError(429, code, message, { retryAfterSeconds }),
  internal: () => new ApiError(500, 'INTERNAL_ERROR', 'Something went wrong on our side. Please try again.'),
}
