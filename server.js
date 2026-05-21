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
import { startAlertMonitor, stopAlertMonitor } from './src/services/alertMonitor.service.js';
import { initWebSocketServer, shutdownWebSocketServer } from './src/utils/websocketServer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure logs directory exists before Winston writes files
fs.mkdirSync(path.join(__dirname, 'logs'), { recursive: true });

const app = createApp();
const server = http.createServer(app);

/** @type {boolean} */
let isShuttingDown = false;

/**
 * Starts listening on the configured port.
 * @returns {Promise<void>}
 */
function listen() {
  return new Promise((resolve, reject) => {
    const onError = (err) => {
      if (err.code === 'EADDRINUSE') {
        reject(
          new Error(
            `Port ${env.port} is already in use. Restart npm run dev to auto-free the port.`,
          ),
        );
      } else {
        reject(err);
      }
    };

    server.once('error', onError);

    server.listen(env.port, () => {
      server.removeListener('error', onError);
      resolve();
    });
  });
}

/**
 * Gracefully shuts down HTTP, WebSocket, alert monitor, and MongoDB.
 * @returns {Promise<void>}
 */
async function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  stopAlertMonitor();
  shutdownWebSocketServer();

  await new Promise((resolve) => {
    server.close(() => resolve());
  });

  await disconnectDB().catch(() => {});
}

/**
 * Boots the TripAI backend server and dependent services.
 * @returns {Promise<void>}
 */
async function startServer() {
  await connectDB();
  await runBootstrap();

  await listen();

  logger.info(`TripAI server running on port ${env.port} [${env.nodeEnv}]`);
  logger.info(`REST API: http://localhost:${env.port}/api/health`);
  logger.info(`WebSocket: ws://localhost:${env.port}/ws`);

  // TODO: In production, replace mock broadcasts with real provider webhook handlers
  initWebSocketServer(server);
  startAlertMonitor();
}

startServer().catch(async (err) => {
  logger.error('Failed to start server', { message: err.message });
  await shutdown();
  process.exit(1);
});

const handleShutdown = async (signal) => {
  logger.info(`${signal} received — shutting down`);
  await shutdown();
  process.exit(0);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

// node --watch sends SIGTERM before restarting
process.on('beforeExit', () => shutdown());
