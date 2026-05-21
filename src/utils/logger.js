/**
 * Winston logger configuration for TripAI backend.
 * Logs to console and rotating file output under logs/ directory.
 */

import winston from 'winston';
import { env } from '../config/env.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

/**
 * Custom log format for readable structured output.
 * @param {object} info - Winston log info object
 * @returns {string}
 */
const logFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `${ts} [${level}]: ${stack || message}`;
});

/**
 * Winston logger instance used across the application.
 * @type {winston.Logger}
 */
const logger = winston.createLogger({
  level: env.logLevel,
  format: combine(errors({ stack: true }), timestamp(), logFormat),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (!env.isProduction) {
  logger.add(
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),
  );
}

export default logger;
