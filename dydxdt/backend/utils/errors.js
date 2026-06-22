/**
 * Centralised async wrapper — eliminates try/catch boilerplate in controllers.
 *
 * Usage:
 *   router.get('/', asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Custom API error with HTTP status.
 */
class ApiError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }

  static badRequest(msg) { return new ApiError(msg, 400); }
  static unauthorized(msg = 'Not authorized') { return new ApiError(msg, 401); }
  static forbidden(msg = 'Forbidden') { return new ApiError(msg, 403); }
  static notFound(msg = 'Not found') { return new ApiError(msg, 404); }
  static conflict(msg) { return new ApiError(msg, 409); }
}

module.exports = { asyncHandler, ApiError };
