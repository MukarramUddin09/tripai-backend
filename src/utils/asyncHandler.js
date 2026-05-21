/**
 * Async route handler wrapper for Express.
 * Forwards rejected promises to the central errorHandler middleware.
 */

/**
 * Wraps an async Express route handler to catch errors.
 * @param {import('express').RequestHandler} fn - Async route handler function
 * @returns {import('express').RequestHandler}
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
