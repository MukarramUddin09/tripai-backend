/**
 * TripAI backend entry point — starts HTTP server, WebSocket, DB, and background jobs.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { createApp } from './src/app.js';
import { connectDB, disconnectDB } from './src/config/db.js';
import { runBootstrap } from './src/config/bootstrap.js';
import { env } from './src/config/env.js';

import logger from './src/utils/logger.js';

import {
  startAlertMonitor,
  stopAlertMonitor,
} from './src/services/alertMonitor.service.js';

import {
  initWebSocketServer,
  shutdownWebSocketServer,
} from './src/utils/websocketServer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure logs directory exists
fs.mkdirSync(path.join(__dirname, 'logs'), { recursive: true });

const app = createApp();
const server = http.createServer(app);

let isShuttingDown = false;

/**
 * Starts HTTP server
 */
function listen() {
  return new Promise((resolve, reject) => {
    const onError = (err) => {
      if (err.code === 'EADDRINUSE') {
        reject(
          new Error(
            `Port ${env.port} is already in use.`,
          ),
        );
      } else {
        reject(err);
      }
    };

    server.once('error', onError);

    // IMPORTANT FOR RENDER
    server.listen(env.port, '0.0.0.0', () => {
      server.removeListener('error', onError);
      resolve();
    });
  });
}

/**
 * Graceful shutdown
 */
async function shutdown() {
  if (isShuttingDown) return;

  isShuttingDown = true;

  logger.info('Graceful shutdown initiated');

  try {
    stopAlertMonitor();

    shutdownWebSocketServer();

    await new Promise((resolve) => {
      server.close(() => resolve());
    });

    await disconnectDB();

    logger.info('Shutdown complete');
  } catch (err) {
    logger.error('Shutdown error', {
      message: err.message,
    });
  }
}

/**
 * Starts backend services
 */
async function startServer() {
  await connectDB();

  await runBootstrap();

  // Initialize WebSocket BEFORE listen if required
  initWebSocketServer(server);

  await listen();

  startAlertMonitor();

  logger.info(
    `TripAI server running on port ${env.port} [${env.nodeEnv}]`,
  );

  // Local dev URLs
  if (env.nodeEnv !== 'production') {
    logger.info(
      `REST API: http://localhost:${env.port}/api/health`,
    );

    logger.info(
      `WebSocket: ws://localhost:${env.port}/ws`,
    );
  } else {
    logger.info('Production mode enabled');
  }
}

/**
 * Startup failure handler
 */
startServer().catch(async (err) => {
  logger.error('Failed to start server', {
    message: err.message,
    stack: err.stack,
  });

  await shutdown();

  process.exit(1);
});

/**
 * Graceful shutdown handlers
 */
const handleShutdown = async (signal) => {
  logger.info(`${signal} received — shutting down`);

  await shutdown();

  process.exit(0);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

// node --watch sends SIGTERM before restart
process.on('beforeExit', async () => {
  await shutdown();
});