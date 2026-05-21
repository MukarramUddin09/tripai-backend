/**
 * CORS configuration for TripAI backend (Vercel frontend + Render API).
 */

import cors from 'cors';
import { env } from './env.js';

/** Production frontend deployed on Vercel */
export const VERCEL_FRONTEND_ORIGIN = 'https://trip-frontend1.vercel.app';

/**
 * Shared CORS options — credentials require a reflected origin (never "*").
 * @type {import('cors').CorsOptions}
 */
const LAN_ORIGIN_RE = /^http:\/\/192\.168\.\d+\.\d+:(5173|8080|8081)$/;

export const corsOptions = {
  origin(origin, callback) {
    // Same-origin / curl / health checks — no Origin header
    if (!origin) {
      return callback(null, true);
    }
    if (env.allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    if (env.isDevelopment && LAN_ORIGIN_RE.test(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

/** Reusable CORS middleware instance */
export const corsMiddleware = cors(corsOptions);
