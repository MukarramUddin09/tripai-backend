/**
 * Express application setup for TripAI backend.
 * Configures security middleware, routes, and central error handling.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { globalRateLimiter } from './middlewares/rateLimit.middleware.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.middleware.js';
import { sendSuccess } from './utils/apiResponse.js';

import authRoutes from './routes/auth.routes.js';
import tripRoutes from './routes/trip.routes.js';
import travelRoutes from './routes/travel.routes.js';
import hotelRoutes from './routes/hotel.routes.js';
import entertainmentRoutes from './routes/entertainment.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import alertRoutes from './routes/alert.routes.js';
import feedbackRoutes from './routes/feedback.routes.js';
import itineraryRoutes from './routes/itinerary.routes.js';

/**
 * Creates and configures the Express application.
 * @returns {import('express').Express}
 */
export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const allowed = [
          env.frontendOrigin,
          'http://localhost:5173',
          'http://localhost:8080',
          'http://localhost:8081',
          'http://127.0.0.1:5173',
          'http://127.0.0.1:8080',
          'http://127.0.0.1:8081',
        ];
        if (allowed.includes(origin) || /^http:\/\/192\.168\.\d+\.\d+:(5173|8080|8081)$/.test(origin)) {
          return callback(null, true);
        }
        callback(new Error(`CORS blocked: ${origin}`));
      },
      credentials: true,
    }),
  );
  app.use(globalRateLimiter);
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  if (env.isDevelopment) {
    app.use(morgan('dev'));
  }

  app.get('/api/health', (_req, res) => {
    sendSuccess(res, { message: 'TripAI API is running', data: { status: 'ok' } });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/trips', tripRoutes);
  app.use('/api/travel', travelRoutes);
  app.use('/api/hotels', hotelRoutes);
  app.use('/api/entertainment', entertainmentRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/alerts', alertRoutes);
  app.use('/api/feedback', feedbackRoutes);
  app.use('/api/itineraries', itineraryRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
