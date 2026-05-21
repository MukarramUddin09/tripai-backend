/**
 * Rate limiting middleware configuration for TripAI API.
 * Protects all routes from abuse using express-rate-limit.
 */

import rateLimit from 'express-rate-limit';

/**
 * Global API rate limiter — 100 requests per 15 minutes per IP.
 * @type {import('express-rate-limit').RateLimitRequestHandler}
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  message: {
    success: false,
    data: null,
    message: 'Too many requests, please try again later',
    error: 'RATE_LIMIT_EXCEEDED',
  },
});

/**
 * Stricter rate limiter for authentication routes.
 * @type {import('express-rate-limit').RateLimitRequestHandler}
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: 'Too many auth attempts, please try again later',
    error: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
});
