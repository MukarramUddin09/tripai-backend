/**
 * Environment variable validation for TripAI backend.
 * Fails fast at startup if required variables are missing or invalid.
 */

import dotenv from 'dotenv';

dotenv.config();

const required = ['MONGODB_URI', 'JWT_SECRET', 'PORT', 'FRONTEND_ORIGIN'];

/**
 * Validates that all required environment variables are present.
 * @throws {Error} If any required variable is missing
 */
function validateEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. See .env.example.`,
    );
  }
}

validateEnv();

/**
 * Typed, validated environment configuration object.
 * @type {object}
 */
export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendOrigin: process.env.FRONTEND_ORIGIN,
  logLevel: process.env.LOG_LEVEL || 'info',
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
  isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};
