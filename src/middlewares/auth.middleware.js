/**
 * JWT authentication middleware for TripAI protected routes.
 * Verifies Bearer tokens and attaches decoded user payload to req.user.
 */

import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './errorHandler.middleware.js';

// TODO: Replace in-memory Map with Redis SET for distributed token blacklist
/** @type {Map<string, number>} */
export const tokenBlacklist = new Map();

/**
 * Checks whether a JWT has been blacklisted (logout).
 * @param {string} token - Raw JWT string
 * @returns {boolean}
 */
export function isTokenBlacklisted(token) {
  const expiry = tokenBlacklist.get(token);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    tokenBlacklist.delete(token);
    return false;
  }
  return true;
}

/**
 * Verifies JWT from Authorization header and sets req.user.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} _res - Express response
 * @param {import('express').NextFunction} next - Express next
 */
export function authenticate(req, _res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Access token required', 401));
  }

  const token = authHeader.split(' ')[1];

  if (isTokenBlacklisted(token)) {
    return next(new AppError('Token has been revoked', 401));
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Token has expired', 401));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token', 401));
    }
    return next(new AppError('Authentication failed', 401));
  }
}

/**
 * Restricts access to admin role only.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} _res - Express response
 * @param {import('express').NextFunction} next - Express next
 */
export function requireAdmin(req, _res, next) {
  if (req.user?.role !== 'admin') {
    return next(new AppError('Admin access required', 403));
  }
  next();
}
