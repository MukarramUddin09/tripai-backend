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

const isDevelopment = (process.env.NODE_ENV || 'development') === 'development';
const isProduction = process.env.NODE_ENV === 'production';

/** @param {string | undefined} value */
function parseOriginList(value) {
  if (!value) return [];
  return value
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

const DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:8081',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:8081',
];

/** Always allow deployed Vercel frontends in production. */
const PRODUCTION_ORIGINS = [
  'https://trip-frontend0.vercel.app',
  'https://trip-frontend1.vercel.app',
];

const allowedOrigins = [
  ...new Set([
    ...parseOriginList(process.env.FRONTEND_ORIGIN),
    ...parseOriginList(process.env.CORS_EXTRA_ORIGINS),
    ...PRODUCTION_ORIGINS,
    ...(isDevelopment ? DEV_ORIGINS : []),
  ]),
];

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
  allowedOrigins,
  openWeatherApiKey: process.env.OPENWEATHER_API_KEY || '',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  adminEmail: (process.env.ADMIN_EMAIL || 'mukarramuddin09@gmail.com').toLowerCase(),
  logLevel: process.env.LOG_LEVEL || 'info',
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
  isDevelopment,
  isProduction,
};
