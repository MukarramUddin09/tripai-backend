/**
 * MongoDB connection module with exponential backoff retry logic.
 * Ensures resilient database connectivity in production deployments.
 */

import mongoose from 'mongoose';
import { env } from './env.js';
import logger from '../utils/logger.js';

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;

/**
 * Connects to MongoDB with retry logic on failure.
 * @param {number} [attempt=1] - Current retry attempt number
 * @returns {Promise<void>}
 */
export async function connectDB(attempt = 1) {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  try {
    await mongoose.connect(env.mongodbUri);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error(`MongoDB connection failed (attempt ${attempt}/${MAX_RETRIES})`, {
      message: error.message,
    });

    if (attempt >= MAX_RETRIES) {
      logger.error('Max MongoDB connection retries exceeded. Exiting.');
      process.exit(1);
    }

    const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
    logger.info(`Retrying MongoDB connection in ${delay}ms...`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return connectDB(attempt + 1);
  }
}

/**
 * Gracefully closes the MongoDB connection.
 * @returns {Promise<void>}
 */
export async function disconnectDB() {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error', { message: err.message });
});
