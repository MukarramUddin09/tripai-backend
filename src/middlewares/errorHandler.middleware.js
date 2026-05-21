/**
 * Central Express error handling middleware for TripAI backend.
 * Normalizes all errors into the standard API response format.
 */

import logger from '../utils/logger.js';
import { sendError } from '../utils/apiResponse.js';

/**
 * Custom application error with HTTP status code.
 */
export class AppError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} [statusCode=500] - HTTP status code
   * @param {*} [details=null] - Additional error details
   */
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Express error handler — must be registered last.
 * @param {Error} err - Error object
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} _next - Express next (unused)
 */
export function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} — ${message}`, {
      stack: err.stack,
      details: err.details,
    });
  } else {
    logger.warn(`${req.method} ${req.originalUrl} — ${message}`);
  }

  sendError(res, {
    message,
    error: err.details || (process.env.NODE_ENV === 'development' ? err.stack : null),
    statusCode,
  });
}

/**
 * Handles requests to undefined routes (404).
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next
 */
export function notFoundHandler(req, res, next) {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
}
