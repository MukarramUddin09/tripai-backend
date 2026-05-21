/**
 * Standardized API response helpers for TripAI REST endpoints.
 * All responses follow: { success, data, message, error }
 */

/**
 * Sends a successful API response.
 * @param {import('express').Response} res - Express response object
 * @param {object} [options] - Response options
 * @param {*} [options.data=null] - Response payload
 * @param {string} [options.message='Success'] - Human-readable message
 * @param {number} [options.statusCode=200] - HTTP status code
 * @returns {import('express').Response}
 */
export function sendSuccess(res, { data = null, message = 'Success', statusCode = 200 } = {}) {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    error: null,
  });
}

/**
 * Sends an error API response (used by error handler primarily).
 * @param {import('express').Response} res - Express response object
 * @param {object} [options] - Error options
 * @param {string} [options.message='An error occurred'] - Error message
 * @param {*} [options.error=null] - Error details
 * @param {number} [options.statusCode=500] - HTTP status code
 * @returns {import('express').Response}
 */
export function sendError(res, { message = 'An error occurred', error = null, statusCode = 500 } = {}) {
  return res.status(statusCode).json({
    success: false,
    data: null,
    message,
    error,
  });
}
